const cron = require('node-cron');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const ProfitGuard = require('../game/ProfitGuard');

// const JackpotService = require('../bonus/JackpotService');

// Pulse: The System Heartbeat
// Runs every 1 minute to check health, profit, and tasks.

const initPulse = () => {
    logger.info('❤️ System Pulse Initiated (1-min Heartbeat)');

    // Schedule: Every 1 minute (* * * * *)
    cron.schedule('* * * * *', async () => {
        const pulseId = `PLS-${Date.now()}`;
        // console.log(`\n[${new Date().toISOString()}] ❤️ Pulse Check (${pulseId})`);

        try {
            // 1. Connectivity Check
            if (mongoose.connection.readyState !== 1) {
                logger.error(`   ❌ Pulse Alarm: DB Disconnected!`);
                return;
            }

            // 2. Active: ProfitGuard Audit
            // [OPTIMIZATION] Moved to Hourly to prevent Render Memory Spike
            // await ProfitGuard.audit();

            // 3. Hourly Tasks (Check minute 0)
            const now = new Date();

            // [LOTTERY AUTOMATION]
            // Check for draw trigger every minute (Efficiency: Low cost check)
            const LotteryService = require('../game/LotteryService');
            await LotteryService.checkDraw();

            if (now.getMinutes() === 0) {
                // [MOVED HERE] Run Heavy Audits Hourly
                await ProfitGuard.audit();

                // await JackpotService.drawHourlyJackpot();

                // Dailys (Midnight Check)
                if (now.getHours() === 0) {
                    // await require('../bonus/HoldingBonusService').processDailyRewards();

                    // Weekly Royal Dividend (Sunday 00:00)
                    if (now.getDay() === 0) {
                        await require('../gamification/LeaderboardService').processRoyalDividend();
                    }
                }
            }

        } catch (err) {
            logger.error(`   ❌ Pulse Failed: ${err.message}`);
        }
    });
};

module.exports = initPulse;
