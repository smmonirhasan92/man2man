const User = require('../user/UserModel');

class TurnoverService {

    // 1. ADD REQUIREMENT (Deposit or Win)
    // Deposit: multiplier = 1
    // Win: multiplier = 20 (High Difficulty)
    static async addRequirement(userId, amount, multiplier = 1, session = null) {
        if (!amount || amount <= 0) return;

        const requirement = amount * multiplier;
        const opts = session ? { session } : {};

        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnover.required': requirement }
        }, opts);

        console.log(`[TURNOVER] User ${userId}: Added ${requirement} to Requirement (Base: ${amount} x ${multiplier})`);
    }

    // 2. RECORD PROGRESS (Bet)
    static async recordBet(userId, betAmount, session = null) {
        if (!betAmount || betAmount <= 0) return;

        const opts = session ? { session } : {};

        // We increment 'completed' turnover
        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnover.completed': betAmount }
        }, opts);

        // console.log(`[TURNOVER] User ${userId}: Progressed ${betAmount}`);
    }

    // 3. CHECK ELIGIBILITY (Withdrawal)
    static async checkWithdrawalEligibility(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        const { required, completed } = user.wallet.turnover || { required: 0, completed: 0 };
        const remaining = required - completed;

        if (remaining > 0) {
            return {
                allowed: false,
                message: `Withdrawal Locked! You need to wager ${remaining.toFixed(2)} more to withdraw.`,
                stats: { required, completed, remaining }
            };
        }

        return { allowed: true, stats: { required, completed, remaining: 0 } };
    }
}

module.exports = TurnoverService;
