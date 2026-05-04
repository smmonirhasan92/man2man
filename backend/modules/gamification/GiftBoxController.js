const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');
const SocketService = require('../common/SocketService'); // [FIX] Manual balance broadcast

const GIFT_TIERS = {
    free: { cost: 0, mult: 1.0 }, // Free is special
    bronze: { cost: 3 },
    silver: { cost: 6 },
    gold: { cost: 9 }
};

exports.openGiftBox = async (req, res) => {
    try {
        const { tier = 'bronze' } = req.body;
        const userId = req.user.user.id;

        if (!GIFT_TIERS[tier]) return res.status(400).json({ success: false, message: 'Invalid tier.' });

        const selectedTier = GIFT_TIERS[tier];
        const cost = selectedTier.cost;
        const windowMs = 500; // Fast-batch window

        // [RETENTION] Fetch streak so engine can force refund after 4+ losses
        const userDoc = await User.findById(userId).select('gameStats.consecutiveLosses').lean();
        const consecutiveLosses = userDoc?.gameStats?.consecutiveLosses || 0;

        // [PHASE 2] STEP 1: DEDUCT BET FIRST (Atomic Protection)
        let initialUserBalance = 0;
        let betResult = { finalBalance: 0 };
        
        if (cost > 0) {
            betResult = await TransactionHelper.runTransaction(async (session) => {
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

                const initBal = user.wallet.main;
                const finalBal = initBal - cost;

                const betTxId = `GIFT_BET_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                
                await Transaction.create([{
                    userId, type: 'game_bet', amount: -cost, currency: 'NXS',
                    status: 'completed', source: 'game',
                    description: `Opened ${tier} Mystery Gift`,
                    transactionId: betTxId,
                    balanceAfter: finalBal
                }], { session, ordered: true });

                await TransactionLedger.create([{
                    userId, type: 'game_bet', amount: -cost,
                    balanceBefore: initBal, balanceAfter: finalBal,
                    description: `Mystery Gift Bet (${tier})`,
                    transactionId: betTxId
                }], { session, ordered: true });
                return { finalBalance: finalBal };
            });

            // [FIX] Broadcast bet deduction so TopBar updates instantly
            SocketService.broadcast(`user_${userId}`, 'balance_update', { main: betResult.finalBalance });
        } else {
            // Free box, just get current balance
            const user = await User.findById(userId).select('wallet.main').lean();
            betResult.finalBalance = user.wallet.main;
        }

        // [PHASE 2] STEP 2: PROCESS MATCH THROUGH ENGINE
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, 'gift', tier, windowMs, consecutiveLosses);
        let winAmt = matchResult.winAmount;

        // [PHASE 2] STEP 3: CREDIT WIN (Separate Atomic Step)
        let finalUserBalance = betResult.finalBalance;

        // [RETENTION FIX] Handle Free Box from Interest Fund ATOMICALLY
        if (cost === 0 && winAmt > 0) {
            const GameVault = require('./GameVaultModel');
            await TransactionHelper.runTransaction(async (session) => {
                // [ATOMIC UPGRADE] Avoid Vault Write Conflicts
                const vault = await GameVault.findOneAndUpdate(
                    { vaultId: 'MASTER_VAULT', 'balances.userInterest': { $gte: winAmt } },
                    { $inc: { 'balances.userInterest': -winAmt } },
                    { session }
                );
                if (!vault) {
                    winAmt = 0; // Empty fund
                }
            });
        }

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

                const winTxId = `GIFT_WIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                const isFree = cost === 0;

                await Transaction.create([{
                    userId, type: 'game_win', amount: winAmt, currency: 'NXS',
                    status: 'completed', source: 'game',
                    description: `Mystery Gift: ${matchResult.label || (isFree ? 'Free Reward' : 'Prize')}`,
                    transactionId: winTxId,
                    balanceAfter: finalBal
                }], { session, ordered: true });

                await TransactionLedger.create([{
                    userId, type: 'game_win', amount: winAmt,
                    balanceBefore: initBal, balanceAfter: finalBal,
                    description: isFree ? `Free Mystery Gift Reward` : `Mystery Gift Prize (${tier})`,
                    transactionId: winTxId
                }], { session, ordered: true });

                // [LOAN RECOVERY] Trigger check after game win
                await WalletService.processLoanRecovery(userId, session);

                return finalBal;
            });
            finalUserBalance = winResult;

            // [FIX] Broadcast win so TopBar balance increases immediately
            SocketService.broadcast(`user_${userId}`, 'balance_update', { main: finalUserBalance });
        } else if (cost > 0) {
             // Record loss stats
             await User.updateOne({ _id: userId }, {
                $inc: { 
                    'gameStats.totalGamesPlayed': 1,
                    'gameStats.netProfitLoss': -cost,
                    'gameStats.consecutiveLosses': 1
                }
            });
        }

        // Match Frontend expectation
        return res.json({
            success: true,
            tier,
            reward: {
                label: matchResult.label || (matchResult.isWin ? 'Super Win' : 'Consolation'),
                amountNXS: winAmt,
                isWin: matchResult.isWin
            },
            newBalance: finalUserBalance
        });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
