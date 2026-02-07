const Transaction = require('../../modules/wallet/TransactionModel');
const SystemSetting = require('../../modules/settings/SystemSettingModel');
const logger = require('../../utils/logger');

/**
 * ProfitGuard: The Mathematical Bodyguard
 * Ensures the system never pays out more than allowed by the Global RTP.
 */
class ProfitGuard {

    /**
     * Audit the system state
     * Calculates Total In vs Total Out and determines safety.
     */
    static async audit() {
        try {
            // 1. Fetch Global Financials
            const stats = await this.getGlobalStats();

            // 2. Fetch Settings
            const targetProfitPercent = await this.getSetting('global_profit_target', 30); // Default 30% Profit for House
            const globalRTP = 100 - targetProfitPercent;

            // 3. Logic: Allowed Pool
            // If we took 1000 In, and Target Profit is 30% (300), we can pay out max 700.
            const allowedPayout = (stats.totalDeposits * (globalRTP / 100));
            const currentPayout = stats.totalWithdrawals + stats.userBalances; // Actual money gone or owed

            const safetyMargin = allowedPayout - currentPayout;
            const isSafe = safetyMargin > 0;

            // Log Pulse
            logger.info(`🛡️ [ProfitGuard] In: ${stats.totalDeposits} | Out+Owed: ${currentPayout} | Safety Margin: ${safetyMargin.toFixed(2)} | Safe: ${isSafe}`);

            return { isSafe, safetyMargin };

        } catch (err) {
            logger.error(`ProfitGuard Audit Error: ${err.message}`);
            return { isSafe: false, safetyMargin: 0 }; // Fail safe
        }
    }

    /**
     * Enforce Safety directly on a Game Bet
     * @param {number} potentialWinAmount - How much the user MIGHT win
     * @returns {Promise<boolean>} - true if safe to let them win, false if force loss
     */
    static async enforceSafety(potentialWinAmount) {
        // Fast Check (Memory Based or Simplified DB)
        // For real scaling, use Redis. For now, DB Aggregation.
        const { isSafe, safetyMargin } = await this.audit();

        if (!isSafe) {
            logger.warn(`🚫 [ProfitGuard] Blocked Win of ${potentialWinAmount}. System in Recovery Mode.`);
            return false;
        }

        // [RELAXED GUARD V2.0]
        // Allow the system to invest in users initially.
        // We only block if we are depleting reserves dangerously.
        // Investment Buffer: 10,000 BDT (System willing to lose this much to acquire users)
        const INVESTMENT_BUFFER = 10000;

        if (safetyMargin + INVESTMENT_BUFFER < 0) {
            logger.warn(`🚫 [ProfitGuard] Blocked Win of ${potentialWinAmount}. System DEEP RED (${safetyMargin}).`);
            return false;
        }

        // Additional: If huge win, strict check
        if (potentialWinAmount > 5000 && safetyMargin < potentialWinAmount) {
            logger.warn(`🚫 [ProfitGuard] Blocked HUGE Win of ${potentialWinAmount}. Not enough margin.`);
            return false;
        }

        return true;
    }

    // --- Helpers ---

    static async getGlobalStats() {
        // Aggregation for Total Deposits
        const deposits = await Transaction.aggregate([
            { $match: { type: { $in: ['add_money', 'deposit'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Aggregation for Total Withdrawals
        const withdrawals = await Transaction.aggregate([
            { $match: { type: 'cash_out', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
        ]);

        // Note: For strict correctness, we should also count User Wallet Balances as 'Liabilities'
        // But for "Cash Flow" profit, mostly In - Out is used. 
        // Let's stick to Cash Flow for now to avoid locking winnings too hard.

        return {
            totalDeposits: deposits[0] ? deposits[0].total : 0,
            totalWithdrawals: withdrawals[0] ? withdrawals[0].total : 0,
            userBalances: 0 // Placeholder if we want to add liability check later
        };
    }

    static async getSetting(key, def) {
        const setting = await SystemSetting.findOne({ key, category: 'global' });
        return setting ? parseFloat(setting.value) : def;
    }
}

module.exports = ProfitGuard;
