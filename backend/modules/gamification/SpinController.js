const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');

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
            const user = await User.findById(userId).session(session);
            if (user.wallet.main < cost) throw new Error('Insufficient Balance');

            const initialBalance = user.wallet.main;
            const finalBalance = initialBalance - cost;
            user.wallet.main = finalBalance;

            const betTxId = `SPIN_BET_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            
            await Transaction.create([{
                userId, type: 'game_bet', amount: -cost, currency: 'NXS',
                status: 'completed', source: 'game',
                description: `Luck Test: ${tierDict[tier].labels.loss} (${tier})`,
                transactionId: betTxId,
                balanceAfter: finalBalance
            }], { session });

            await TransactionLedger.create([{
                userId, type: 'game_bet', amount: -cost,
                balanceBefore: initialBalance, balanceAfter: finalBalance,
                description: `Luck Test Bet (${tier})`,
                transactionId: betTxId
            }], { session });

            user.markModified('wallet.main');
            await user.save({ session });
            return { initialBalance, finalBalance };
        });

        // [PHASE 2] STEP 2: PROCESS MATCH THROUGH ENGINE
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, tier, windowMs, consecutiveLosses, username);
        const winAmt = matchResult.winAmount;

        // [PHASE 2] STEP 3: CREDIT WIN (Separate Atomic Step)
        let finalUserBalance = betResult.finalBalance;
        if (winAmt > 0) {
            const winResult = await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                const initBal = user.wallet.main;
                const finalBal = initBal + winAmt;
                
                user.wallet.main = finalBal;

                const winTxId = `SPIN_WIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                await Transaction.create([{
                    userId, type: 'game_win', amount: winAmt, currency: 'NXS',
                    status: 'completed', source: 'game',
                    description: `Luck Test Win: ${matchResult.label || tierDict[tier].labels.win}`,
                    transactionId: winTxId,
                    balanceAfter: finalBal
                }], { session });

                await TransactionLedger.create([{
                    userId, type: 'game_win', amount: winAmt,
                    balanceBefore: initBal, balanceAfter: finalBal,
                    description: `Luck Test Reward (${tier})`,
                    transactionId: winTxId
                }], { session });

                // Stats Update
                user.gameStats.totalGamesPlayed += 1;
                user.gameStats.netProfitLoss += (winAmt - cost);
                if (matchResult.isWin) {
                    user.gameStats.totalGamesWon += 1;
                    user.gameStats.consecutiveLosses = 0;
                } else {
                    user.gameStats.consecutiveLosses += 1;
                }

                user.markModified('wallet.main');
                user.markModified('gameStats');
                await user.save({ session });
                return finalBal;
            });
            finalUserBalance = winResult;
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
