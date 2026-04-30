const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');

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
                const user = await User.findById(userId).session(session);
                if (user.wallet.main < cost) throw new Error('Insufficient Balance');

                const initBal = user.wallet.main;
                const finalBal = initBal - cost;
                user.wallet.main = finalBal;

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

                user.markModified('wallet.main');
                await user.save({ session });
                return { finalBalance: finalBal };
            });
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
                const vault = await GameVault.findOne({ vaultId: 'MASTER_VAULT' }).session(session);
                if (vault && vault.balances.userInterest >= winAmt) {
                    vault.balances.userInterest -= winAmt;
                    await vault.save({ session });
                } else {
                    winAmt = 0; // Empty fund
                }
            });
        }

        if (winAmt > 0) {
            const winResult = await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                const initBal = user.wallet.main;
                const finalBal = initBal + winAmt;
                
                user.wallet.main = finalBal;

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

                // Stats Update
                user.gameStats.totalGamesPlayed += 1;
                user.gameStats.netProfitLoss += (winAmt - cost);
                if (matchResult.isWin) user.gameStats.totalGamesWon += 1; else user.gameStats.consecutiveLosses += 1;

                user.markModified('wallet.main');
                user.markModified('gameStats');
                await user.save({ session });
                return finalBal;
            });
            finalUserBalance = winResult;
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
