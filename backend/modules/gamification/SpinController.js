const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');
const SocketService = require('../common/SocketService'); // [FIX] Manual balance broadcast

const SPIN_TIERS = {
  bronze: { costNXS: 3,  labels: { win: 'Bronze Jackpot', loss: 'Miss' } },
  silver: { costNXS: 6,  labels: { win: 'Silver Jackpot', loss: 'Miss' } },
  gold:   { costNXS: 9,  labels: { win: 'Gold Jackpot',   loss: 'Miss' } }
};

// --- SPIN LOGIC (Luck Test) ---
exports.spinLuckTest = async (req, res) => {
    // 1200ms allows real humans tapping roughly together to batch perfectly without feeling laggy
    return processGameRequest(req, res, 'spin', 1200);
};

async function processGameRequest(req, res, gameType, windowMs) {
    try {
        const { tier } = req.body;
        const userId = req.user.user.id;
        const username = req.user.user.username || 'User';

        const tierDict = SPIN_TIERS;

        if (!tier || !tierDict[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const cost = tierDict[tier].costNXS;

        // [RETENTION] Fetch streak so engine can force refund after 4+ losses
        const userDoc = await User.findById(userId).select('gameStats.consecutiveLosses').lean();
        const consecutiveLosses = userDoc?.gameStats?.consecutiveLosses || 0;

        // [PHASE 2] STEP 1: DEDUCT BET FIRST (Atomic Protection)
        const betResult = await TransactionHelper.runTransaction(async (session) => {
            // [ATOMIC UPGRADE] Zero Locking
            const user = await User.findOneAndUpdate(
                { _id: userId, 'wallet.main': { $gte: cost } },
                { $inc: { 'wallet.main': -cost } },
                { session, new: false }
            );

            if (!user) {
                const exists = await User.findById(userId).session(session);
                if (!exists) throw new Error('User not found');
                throw new Error('Insufficient Balance');
            }

            const initialBalance = user.wallet.main;
            const finalBalance = initialBalance - cost;

            const betTxId = `SPIN_BET_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            
            await Transaction.create([{
                userId, type: 'game_bet', amount: -cost, currency: 'NXS',
                status: 'completed', source: 'game',
                description: `Luck Test: ${tierDict[tier].labels.loss} (${tier})`,
                transactionId: betTxId,
                balanceAfter: finalBalance
            }], { session, ordered: true });

            await TransactionLedger.create([{
                userId, type: 'game_bet', amount: -cost,
                balanceBefore: initialBalance, balanceAfter: finalBalance,
                description: `Luck Test Bet (${tier})`,
                transactionId: betTxId
            }], { session, ordered: true });

            return { initialBalance, finalBalance };
        });

        // [FIX] Broadcast bet deduction so TopBar updates instantly
        SocketService.broadcast(`user_${userId}`, 'balance_update', { main: betResult.finalBalance });

        // [PHASE 2] STEP 2: PROCESS MATCH THROUGH ENGINE
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, tier, windowMs, consecutiveLosses, username);
        const winAmt = matchResult.winAmount;

        // [PHASE 2] STEP 3: CREDIT WIN (Separate Atomic Step)
        let finalUserBalance = betResult.finalBalance;
        if (winAmt > 0) {
            const WalletService = require('../wallet/WalletService'); // [NEW] For Loan Recovery
            const winResult = await TransactionHelper.runTransaction(async (session) => {
                // [ATOMIC UPGRADE] Simultaneous balance and stats update
                let updateQuery = {
                    $inc: {
                        'wallet.main': winAmt,
                        'gameStats.totalGamesPlayed': 1,
                        'gameStats.netProfitLoss': (winAmt - cost)
                    }
                };

                if (matchResult.isWin) {
                    updateQuery.$inc['gameStats.totalGamesWon'] = 1;
                    updateQuery.$set = { 'gameStats.consecutiveLosses': 0 };
                } else {
                    updateQuery.$inc['gameStats.consecutiveLosses'] = 1;
                }

                const user = await User.findOneAndUpdate(
                    { _id: userId },
                    updateQuery,
                    { session, new: false }
                );

                const initBal = parseFloat(user.wallet?.main || 0);
                const finalBal = initBal + winAmt;

                const winTxId = `SPIN_WIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                await Transaction.create([{
                    userId, type: 'game_win', amount: winAmt, currency: 'NXS',
                    status: 'completed', source: 'game',
                    description: `Luck Test Win: ${matchResult.label || tierDict[tier].labels.win}`,
                    transactionId: winTxId,
                    balanceAfter: finalBal
                }], { session, ordered: true });

                await TransactionLedger.create([{
                    userId, type: 'game_win', amount: winAmt,
                    balanceBefore: initBal, balanceAfter: finalBal,
                    description: `Luck Test Reward (${tier})`,
                    transactionId: winTxId
                }], { session, ordered: true });

                // [LOAN RECOVERY] Trigger check after game win
                await WalletService.processLoanRecovery(userId, session);

                return finalBal;
            });
            finalUserBalance = winResult;

            // [FIX] Broadcast win credit so TopBar balance updates immediately
            SocketService.broadcast(`user_${userId}`, 'balance_update', { main: finalUserBalance });
        } else {
            // Even if win is 0, we update stats for the loss
            await User.updateOne({ _id: userId }, {
                $inc: { 
                    'gameStats.totalGamesPlayed': 1,
                    'gameStats.netProfitLoss': -cost,
                    'gameStats.consecutiveLosses': 1
                }
            });
        }

        // SUCCESS Bridge Response
        return res.json({
            success: true,
            tier,
            game: gameType,
            result: {
                label: matchResult.label || (matchResult.isWin ? tierDict[tier].labels.win : tierDict[tier].labels.loss),
                amountNXS: winAmt,
                isWin: matchResult.isWin,
                mode: matchResult.mode,
                sliceIndex: matchResult.sliceIndex // Use ENGINE's calculated slice!
            },
            newBalance: finalUserBalance
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
