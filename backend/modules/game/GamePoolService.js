const mongoose = require('mongoose');
const GameLog = require('./GameLogModel');
const SystemSetting = require('../settings/SystemSettingModel');

/**
 * GamePoolService
 * Responsible for ensuring the "House Never Loses" by calculating
 * the global betting pool and enforcing profit margins.
 */
class GamePoolService {

    /**
     * Calculate the current safe payout pool.
     * Logic: Total Bets (Global/Timeframe) - Profit Margin = Max Payout Pool
     * @param {string} gameType - Optional, to segregate pools by game
     */
    static async getSafePayoutPool(gameType = null) {
        // 1. Get Profit Margin Setting
        // Profit Guard Rule: Admin keeps 30% (RTP 70%)
        let profitMarginPercent = 30;
        const profitSetting = await SystemSetting.findOne({ key: 'global_profit_target' }); // Aligned with ProfitGuard
        if (profitSetting) {
            profitMarginPercent = parseFloat(profitSetting.value);
        }

        // 2. Calculate Total Bets (Global or Game-Specific)
        // For efficiency, we might limit this to the "Current Active Session" or "Last 24 Hours"
        // depending on how "Total" the user wants. 
        // User said: "System works on calculation of betting amount percentage of that category"

        // We will sum bets from the last 24 hours to ensure daily profitability
        const startTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

        const matchStage = { createdAt: { $gte: startTime } };
        if (gameType) {
            matchStage.gameType = gameType;
        }

        const stats = await GameLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalBets: { $sum: "$betAmount" },
                    totalPayouts: { $sum: "$payout" }
                }
            }
        ]);

        const totalBets = stats[0]?.totalBets || 0;
        const totalPayouts = stats[0]?.totalPayouts || 0;

        // 3. Calculate Limit
        const vaultTax = totalBets * 0.05; // 5% Vault Tax
        const profitMargin = (totalBets * profitMarginPercent) / 100; // 25% Admin Profit (or config)

        const maxAllowedPayouts = totalBets - profitMargin - vaultTax;
        const currentAvailablePool = maxAllowedPayouts - totalPayouts;

        // If pool is negative, we are "Overpaid" -> Force Loss or Minimal Win
        return {
            totalBets,
            totalPayouts,
            profitMargin,
            vaultTax,
            currentAvailablePool: Math.max(0, currentAvailablePool), // Never return negative, just 0
            isPoolSafe: currentAvailablePool > 0
        };
    }

    /**
     * Check if a specific potential payout is safe.
     * @param {number} potentialPayout - The amount user WOULD win
     * @param {string} gameType 
     */
    static async isPayoutSafe(potentialPayout, gameType = null) {
        const poolData = await this.getSafePayoutPool(gameType);

        // If there's enough room in the pool for this win
        if (poolData.currentAvailablePool >= potentialPayout) {
            return true;
        }

        // EDGE CASE: If it's the very first bet or low volume, allow small wins to build engagement
        // otherwise nobody will ever win significantly at start.
        if (poolData.totalBets < 1000 && potentialPayout < 50) {
            return true; // Allow small "Hook" wins
        }

        return false;
    }

    /**
     * Get RTP (Return to Player) for a specific user to prevent "Sniiping"
     * User said: "If 100 to 1000tk income, give turnover logic"
     */
    static async getUserRTP(userId) {
        const stats = await GameLog.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalBets: { $sum: "$betAmount" },
                    totalWins: { $sum: "$payout" }
                }
            }
        ]);

        const bets = stats[0]?.totalBets || 0;
        const wins = stats[0]?.totalWins || 0;

        return {
            bets,
            wins,
            rtp: bets > 0 ? (wins / bets) * 100 : 0
        };
    }


    // --- RETENTION ENGINE ---

    /**
     * Process a Big Win to see if Turnover Lock is needed.
     * Rule: If Win > 1000 BDT, Add 20x Requirement.
     */
    static async checkBigWinRetention(userId, winAmount, session = null) {
        if (winAmount < 1000) return; // Threshold

        const User = require('../user/UserModel');
        const multiplier = 20; // Configurable
        const additionalReq = winAmount * multiplier;
        const opts = session ? { session } : {};

        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnoverRequired': additionalReq }
        }, opts);

        console.log(`🔒 Turnover Lock: User ${userId} needs to play +${additionalReq}`);
    }

    /**
     * Track Turnover Progress on every Bet.
     */
    static async updateTurnover(userId, betAmount, session = null) {
        const User = require('../user/UserModel');
        const opts = session ? { session } : {};

        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnoverCurrent': betAmount }
        }, opts);
    }

    /**
     * Deduct 5% Vault Tax from a Bet
     */
    static async processVaultTax(betAmount, session = null) {
        const BonusVault = require('../bonus/BonusVaultModel');
        const tax = betAmount * 0.05;
        const opts = session ? { session, upsert: true, new: true } : { upsert: true, new: true };

        // Update Vault (Upsert)
        await BonusVault.findOneAndUpdate({}, {
            $inc: { balance: tax, totalIn: tax }
        }, opts);

        return tax;
    }
}

module.exports = GamePoolService;
