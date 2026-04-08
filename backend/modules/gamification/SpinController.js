const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');

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

        const tierDict = SPIN_TIERS;

        if (!tier || !tierDict[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const cost = tierDict[tier].costNXS;

        // [RETENTION] Fetch streak so engine can force refund after 4+ losses
        const userDoc = await User.findById(userId).select('gameStats.consecutiveLosses').lean();
        const consecutiveLosses = userDoc?.gameStats?.consecutiveLosses || 0;

        // Process through Pure Pooling Engine
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, tier, windowMs, consecutiveLosses);
        const winAmt = matchResult.winAmount;

        // [FIX] Priority: Always use the engine's pre-calculated slice and label for consistency
        const sliceIndex = matchResult.sliceIndex;

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
            newBalance: result.finalBalance
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
