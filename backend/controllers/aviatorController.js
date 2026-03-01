const AviatorService = require('../modules/game/AviatorService');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const GameLog = require('../modules/game/GameLogModel');

exports.getGameState = (req, res) => {
    res.json(AviatorService.getState());
};

exports.placeBet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.user.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Enforce Game Wallet Usage
        if ((user.wallet.game || 0) < amount) {
            return res.status(400).json({ message: 'Insufficient Game Balance. Please Transfer to Game Wallet.' });
        }

        // Logic check
        const betResult = await AviatorService.placeBet(userId, amount);

        // Deduct Game Balance
        user.wallet.game -= amount;
        await user.save();

        // Log Game (Initial status: LOSS). Update to WIN if cashout calls.
        // This handles "Crash" scenario implicitly (log stays as loss).
        await GameLog.create({
            userId,
            gameType: 'aviator',
            betAmount: amount,
            result: 'loss', // Default to loss until cashed out
            payout: 0,
            multiplier: 0
        });

        res.json({ message: 'Bet Placed', newBalance: user.wallet.game, betId: betResult.betId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.cashOut = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { betId, multiplier } = req.body;

        // Fallback: Default to 1.00x if missing
        const mult = parseFloat(multiplier) || 1.00;

        // Service handles Validation, Logic, and DB Balance Update
        const betResult = await AviatorService.cashOut(userId, betId, mult);

        // 1. Update GameLog to WIN
        try {
            const recentLog = await GameLog.findOne({
                userId,
                gameType: 'aviator',
                result: 'loss'
            }).sort({ createdAt: -1 });

            if (recentLog) {
                recentLog.result = 'win';
                recentLog.payout = betResult.win;
                recentLog.multiplier = mult;
                await recentLog.save();
            }

            // 2. Create Transaction for Win (Consistency)
            await Transaction.create({
                userId,
                type: 'game_win',
                amount: betResult.win,
                status: 'completed',
                description: `Aviator Win (${mult}x)`,
                balanceAfter: betResult.balance
            });
        } catch (logErr) {
            console.error("Aviator Log Error:", logErr);
            // Non-blocking
        }

        // Return Correct Keys for Frontend
        res.json({
            message: 'Cashed Out!',
            winAmount: betResult.win,
            newBalance: betResult.balance
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
