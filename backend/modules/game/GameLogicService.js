const User = require('../user/UserModel');
const SystemSetting = require('../settings/SystemSettingModel');
const Logger = require('../common/Logger');

class GameLogicService {

    // Config
    DEFAULT_WIN_RATE = 0.45; // 45% Base Win Rate
    LOYALTY_BOOST = 0.12;    // +12% for loyal users
    MIN_ACTIVITY_HOURS = 2;  // Hours of activity to qualify
    HOUSE_EDGE = 0.05;       // 5% minimum house edge

    /**
     * Calculate Win Probability for a specific user.
     * Combines Base Rate + Loyalty Boost - Global Profit Guard.
     */
    async getUserWinProbability(userId) {
        try {
            const user = await User.findById(userId).select('dailyActivityHours wallet.game');
            if (!user) return this.DEFAULT_WIN_RATE;

            let winRate = this.DEFAULT_WIN_RATE;

            // 1. Loyalty Boost
            if ((user.dailyActivityHours || 0) >= this.MIN_ACTIVITY_HOURS) {
                winRate += this.LOYALTY_BOOST;
                // Logger.info(`[GAME_LOGIC] User ${userId} gets Loyalty Boost! New Rate: ${winRate}`);
            }

            // 2. Global Profit Guard Adjustment
            // If House Profit is too low (< 25%), reduce win rate.
            // This usually fetches from a consolidated stats service or Redis. 
            // For now, we simulate a check or use a placeholder.
            // const safe = await ProfitGuard.isSafe(); // Assuming ProfitGuard exists
            // if (!safe) winRate -= 0.15; // Penalty if house is losing

            // Cap Win Rate (Max 80% even with boosts)
            if (winRate > 0.80) winRate = 0.80;

            return winRate;
        } catch (err) {
            Logger.error('[GAME_LOGIC] Error calculating win rate', err);
            return this.DEFAULT_WIN_RATE; // Fail safe
        }
    }

    /**
     * Determine Game Result based on Probability
     */
    async determineOutcome(userId) {
        const probability = await this.getUserWinProbability(userId);
        const rand = Math.random();
        const isWin = rand < probability;

        return {
            result: isWin ? 'win' : 'loss',
            probabilityUsed: probability,
            roll: rand
        };
    }
}

module.exports = new GameLogicService();
