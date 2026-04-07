const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');

const GIFT_TIERS = {
    free: { cost: 0, mult: 1.0 }, // Free is special
    bronze: { cost: 5 },
    silver: { cost: 15 },
    gold: { cost: 30 }
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

        // Fetch and deduct Free Box directly from User-Interest Fund to keep Admin protected
        if (cost === 0) {
            const GameVault = require('./GameVaultModel');
            const vault = await GameVault.getMasterVault();
            winAmt = parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)); // Reduced free tier payload to 0.1-0.6
            
            if (vault.balances.userInterest >= winAmt) {
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, { $inc: { 'balances.userInterest': -winAmt }});
            } else {
               winAmt = 0; // Vault is empty, Free Box gives nothing!
            }
        }

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
                label: matchResult.label || (matchResult.isWin ? 'Super Win' : 'Consolation'),
                amountNXS: winAmt,
                isWin: matchResult.isWin
            },
            newBalance: resultData.finalBalance
        });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
