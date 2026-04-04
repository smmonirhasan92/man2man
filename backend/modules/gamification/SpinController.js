const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');

const TIERS = {
  bronze: { costNXS: 5, labels: { win: 'Bronze Jackpot', loss: 'Miss' } },
  silver: { costNXS: 10, labels: { win: 'Silver Jackpot', loss: 'Miss' } },
  gold: { costNXS: 15, labels: { win: 'Gold Jackpot', loss: 'Miss' } }
};

// --- SPIN LOGIC (Luck Test) ---
exports.spinLuckTest = async (req, res) => {
    return processGameRequest(req, res, 'spin', 50);
};

// --- SCRATCH CARD LOGIC ---
exports.scratchCard = async (req, res) => {
    return processGameRequest(req, res, 'scratch', 2000); // 2s window
};

async function processGameRequest(req, res, gameType, windowMs) {
    try {
        const { tier } = req.body;
        const userId = req.user.user.id;

        if (!tier || !TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const cost = TIERS[tier].costNXS;

        // Process through Pure Pooling Engine
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, gameType, windowMs);
        const winAmt = matchResult.winAmount;

        // --- MAP DYNAMIC MULTIPLIER TO VISUAL WHEEL SLICE ---
        const mult = parseFloat((winAmt / cost).toFixed(2));
        let sliceIndex = 4; // Default to Loss (0)
        if (mult === 5.0) sliceIndex = 0;
        else if (mult === 3.0) sliceIndex = 1;
        else if (mult === 2.5) sliceIndex = 2;
        else if (mult === 2.0) sliceIndex = 3;
        else if (mult === 0.0) sliceIndex = 4;
        else if (mult === 1.5) sliceIndex = 5;
        else if (mult === 1.0) sliceIndex = 6;
        else if (mult === 0.5) sliceIndex = 7;

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
                label: matchResult.label || (matchResult.isWin ? TIERS[tier].labels.win : TIERS[tier].labels.loss),
                amountNXS: winAmt,
                isWin: matchResult.isWin,
                mode: matchResult.mode,
                sliceIndex: sliceIndex
            },
            newBalance: result.finalBalance
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
