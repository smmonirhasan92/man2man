const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');

const SCRATCH_TIERS = {
  bronze: { costNXS: 3,  labels: { win: 'Bronze Fortune', loss: 'Miss' } },
  silver: { costNXS: 6,  labels: { win: 'Silver Luck',    loss: 'Miss' } },
  gold:   { costNXS: 9,  labels: { win: 'Golden Treasure', loss: 'Miss' } }
};

exports.scratchCard = async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user.user.id;
        const gameType = 'scratch';

        if (!tier || !SCRATCH_TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const cost = SCRATCH_TIERS[tier].costNXS;
        const windowMs = 500; // Fast-batch window

        // [RETENTION] Fetch streak so engine can force refund after 4+ losses
        const userDoc = await User.findById(userId).select('gameStats.consecutiveLosses').lean();
        const consecutiveLosses = userDoc?.gameStats?.consecutiveLosses || 0;

        // [PHASE 2] STEP 1: DEDUCT BET FIRST (Atomic Protection)
        const betResult = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (user.wallet.main < cost) throw new Error('Insufficient Balance');

            const initBal = user.wallet.main;
            const finalBal = initBal - cost;
            user.wallet.main = finalBal;

            const betTxId = `SCRATCH_BET_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            
            await Transaction.create([{
                userId, type: 'game_bet', amount: -cost, currency: 'NXS',
                status: 'completed', source: 'game',
                description: `Scratch Card: ${SCRATCH_TIERS[tier].labels.loss} (${tier})`,
                transactionId: betTxId,
                balanceAfter: finalBal
            }], { session });

            await TransactionLedger.create([{
                userId, type: 'game_bet', amount: -cost,
                balanceBefore: initBal, balanceAfter: finalBal,
                description: `Scratch Card Bet (${tier})`,
                transactionId: betTxId
            }], { session });

            user.markModified('wallet.main');
            await user.save({ session });
            return { finalBalance: finalBal };
        });

        // [PHASE 2] STEP 2: PROCESS MATCH THROUGH ENGINE
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, tier, windowMs, consecutiveLosses);
        const winAmt = matchResult.winAmount;

        // [PHASE 2] STEP 3: CREDIT WIN (Separate Atomic Step)
        let finalUserBalance = betResult.finalBalance;
        if (winAmt > 0) {
            const winResult = await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                const initBal = user.wallet.main;
                const finalBal = initBal + winAmt;
                
                user.wallet.main = finalBal;

                const winTxId = `SCRATCH_WIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                await Transaction.create([{
                    userId, type: 'game_win', amount: winAmt, currency: 'NXS',
                    status: 'completed', source: 'game',
                    description: `Scratch Card Win: ${matchResult.label || SCRATCH_TIERS[tier].labels.win}`,
                    transactionId: winTxId,
                    balanceAfter: finalBal
                }], { session });

                await TransactionLedger.create([{
                    userId, type: 'game_win', amount: winAmt,
                    balanceBefore: initBal, balanceAfter: finalBal,
                    description: `Scratch Card Reward (${tier})`,
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
             // Record loss stats
             await User.updateOne({ _id: userId }, {
                $inc: { 
                    'gameStats.totalGamesPlayed': 1,
                    'gameStats.netProfitLoss': -cost,
                    'gameStats.consecutiveLosses': 1
                }
            });
        }

        // SUCCESS Bridge Response (NO SLICE INDEX)
        return res.json({
            success: true,
            tier,
            game: gameType,
            result: {
                label: matchResult.label || (matchResult.isWin ? SCRATCH_TIERS[tier].labels.win : SCRATCH_TIERS[tier].labels.loss),
                amountNXS: winAmt,
                isWin: matchResult.isWin,
                mode: matchResult.mode
            },
            newBalance: finalUserBalance
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
