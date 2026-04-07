const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');

const SCRATCH_TIERS = {
  bronze: { costNXS: 5,  labels: { win: 'Bronze Fortune', loss: 'Miss' } },
  silver: { costNXS: 15, labels: { win: 'Silver Luck', loss: 'Miss' } },
  gold:   { costNXS: 30, labels: { win: 'Golden Treasure', loss: 'Miss' } }
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

        // Process through Pure Pooling Engine (0s window for instant feedback)
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, 0);
        const winAmt = matchResult.winAmount;

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (user.wallet.main < cost) throw new Error('Insufficient Balance');

            const initialBalance = user.wallet.main;
            const finalBalance = initialBalance - cost + winAmt;

            // [SECURITY] SANITY CHECK
            const isSafe = await TransactionHelper.checkBalanceSafety(initialBalance, finalBalance);
            if (!isSafe) throw new Error('Security Alert: Excessive Balance Change Blocked.');

            user.wallet.main = finalBalance;

            // Stats Update (Real-time P&L Tracking)
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

            return { winAmt, finalBalance: user.wallet.main };
        });

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
            newBalance: result.finalBalance
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
