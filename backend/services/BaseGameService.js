
const User = require('../modules/user/UserModel');
const GameLog = require('../modules/game/GameLogModel');
const GamePoolService = require('../modules/game/GamePoolService');
const TurnoverService = require('../modules/wallet/TurnoverService');
// const TransactionHelper = require('../common/TransactionHelper'); 

// const TransactionHelper = require('../common/TransactionHelper'); // Logic moved to individual services if complex, or helper used here.

class BaseGameService {

    constructor(gameType) {
        this.gameType = gameType; // 'mines', 'aviator', etc.
    }

    /**
     * Handle Initial Bet Deduction (Atomic)
     * To be called inside a Transaction Session usually
     */
    async handleBet(userId, amount, session) {
        if (amount <= 0) throw new Error("Invalid bet amount.");

        const opts = session ? { session } : {};

        // 1. Deduct Balance (Atomic Check & Update)
        const user = await User.findOneAndUpdate(
            { _id: userId, 'w_dat.g': { $gte: amount } },
            { $inc: { 'w_dat.g': -amount } },
            { new: true, ...opts }
        );

        if (!user) {
            // Check if user exists or just low balance
            const exists = await User.exists({ _id: userId });
            if (!exists) throw new Error("User not found.");
            throw new Error("Insufficient Game Balance. Move funds from Main Wallet.");
        }

        // 2. Vault Tax (5%)
        await GamePoolService.processVaultTax(amount, session);

        // 3. Record Turnover
        await TurnoverService.recordBet(userId, amount, session);

        return user;
    }

    /**
     * Handle Win Credit (Atomic)
     */
    async handleWin(userId, winAmount, session) {
        if (winAmount <= 0) return; // No win

        const opts = session ? { session } : {};
        await User.findByIdAndUpdate(userId, {
            $inc: { 'w_dat.g': winAmount }
        }, opts);
    }

    /**
     * Check Profit Guard (Is Payout Safe?)
     */
    async checkProfitGuard(potentialPayout) {
        return await GamePoolService.isPayoutSafe(potentialPayout, this.gameType);
    }

    /**
     * Log Game Result
     */
    async logGameResult(userId, gameId, betAmount, winAmount, multiplier, status, details, session) {
        const opts = session ? { session } : {};

        const profit = winAmount - betAmount;

        await GameLog.create([{
            userId,
            gameId,
            gameType: this.gameType,
            betAmount,
            winAmount,
            multiplier,
            profit,
            status,
            details
        }], opts);
    }
}

module.exports = BaseGameService;
