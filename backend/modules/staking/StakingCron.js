const UserStake = require('./UserStakeModel');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const SocketService = require('../common/SocketService');
const logger = require('../../utils/logger');

class StakingCron {
    async processDailyReturns() {
        try {
            logger.info("⏱️ [STAKING CRON] Initiating Daily Profit Distribution...");
            
            const processDate = new Date();
            const startOfToday = new Date(processDate.getFullYear(), processDate.getMonth(), processDate.getDate());
            
            const activeStakes = await UserStake.find({
                status: 'ACTIVE',
                $or: [
                    { lastProcessedDate: { $exists: false } },
                    { lastProcessedDate: { $lt: startOfToday } }
                ]
            }).populate('poolId');

            let processedCount = 0;
            let totalPaid = 0;

            for (const stake of activeStakes) {
                if (stake.lockedAt >= startOfToday) {
                    continue; // Must hold for at least 1 day to get first payout
                }

                try {
                    await TransactionHelper.runTransaction(async (session) => {
                        const dailyProfit = parseFloat((stake.expectedReward / stake.poolId.durationDays).toFixed(6));
                        
                        const userUpd = await User.findByIdAndUpdate(stake.userId, {
                            $inc: {
                                'wallet.income': dailyProfit,
                                'wallet.total_earned_staking': dailyProfit
                            }
                        }, { new: true, session });

                        stake.accumulatedPaid = parseFloat(((stake.accumulatedPaid || 0) + dailyProfit).toFixed(6));
                        stake.lastProcessedDate = processDate;
                        await stake.save({ session });

                        await Transaction.create([{
                            userId: stake.userId,
                            amount: dailyProfit,
                            type: 'staking_daily_profit',
                            description: `Daily Profit: ${stake.poolId.name}`,
                            source: 'system',
                            status: 'completed',
                            currency: 'NXS'
                        }], { session, ordered: true });

                        if (SocketService.getIO()) {
                            SocketService.broadcast(`user_${stake.userId}`, `balance_update`, userUpd.wallet);
                        }
                    });

                    processedCount++;
                    totalPaid += (stake.expectedReward / stake.poolId.durationDays);
                } catch (err) {
                    logger.error(`[STAKING CRON] Error processing stake ${stake._id}: ${err.message}`);
                }
            }
            
            logger.info(`✅ [STAKING CRON] Finished. Processed: ${processedCount} Stakes. Total Paid: ${totalPaid.toFixed(6)} NXS`);
        } catch (error) {
            logger.error(`[STAKING CRON] CRITICAL FAILURE: ${error.message}`);
        }
    }
}

module.exports = new StakingCron();
