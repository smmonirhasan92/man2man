const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');

const GIFT_TIERS = {
    free: { cost: 0, mult: 1.0 }, // Free is special
    bronze: { cost: 1 },
    silver: { cost: 5 },
    gold: { cost: 10 }
};

exports.openGiftBox = async (req, res) => {
    try {
        const { tier = 'bronze' } = req.body;
        const userId = req.user.user.id;

        if (!GIFT_TIERS[tier]) return res.status(400).json({ success: false, message: 'Invalid tier.' });

        const selectedTier = GIFT_TIERS[tier];
        const cost = selectedTier.cost;

        // Process through Pure Pooling Engine (10+10=20)
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, 'gift', 1500);
        let winAmt = matchResult.winAmount;

        // [FAIL-SAFE] Explicitly CAP the win to 1.8x of cost as requested (10 NXS -> Max 18 NXS)
        winAmt = Math.min(winAmt, cost * 1.8);

        const resultData = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (user.wallet.main < cost) throw new Error('Insufficient Balance');

            const initialBalance = user.wallet.main;
            const finalBalance = initialBalance - cost + winAmt;

            // [SECURITY] SANITY CHECK
            const isSafe = await TransactionHelper.checkBalanceSafety(initialBalance, finalBalance);
            if (!isSafe) throw new Error('Security Alert: Excessive Balance Change Blocked.');

            user.wallet.main = finalBalance;

            // Stats Update
            user.gameStats.totalGamesPlayed += 1;
            user.gameStats.netProfitLoss += (winAmt - cost);
            if (matchResult.isWin) user.gameStats.totalGamesWon += 1; else user.gameStats.consecutiveLosses += 1;

            user.markModified('wallet.main');
            user.markModified('gameStats');
            await user.save({ session });

            return { winAmt, finalBalance: user.wallet.main };
        });

        // Match Frontend expectation
        return res.json({
            success: true,
            tier,
            reward: {
                label: matchResult.isWin ? 'Super Win' : 'Consolation',
                amountNXS: winAmt,
                isWin: matchResult.isWin
            },
            newBalance: resultData.finalBalance
        });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
