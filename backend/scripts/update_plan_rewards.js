const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../modules/admin/PlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function updateRewards() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const plans = await Plan.find({});
        console.log(`Found ${plans.length} plans. Calculating updates...`);

        for (const plan of plans) {
            // --- LOGIC FROM TaskService.js ---

            // 1. Currency Normalization
            let unlockPrice = plan.unlock_price || 0;
            if (unlockPrice > 100) {
                unlockPrice = unlockPrice / 120.65; // Convert BDT to USD
            }

            const roiPercent = plan.roi_percentage || 150;
            const validityDays = plan.validity_days || 35;
            const dailyLimit = plan.daily_limit || 15;

            // 2. Calculate Targets
            const totalRevenueTarget = unlockPrice * (roiPercent / 100);
            const averageDaily = totalRevenueTarget / validityDays;

            // 3. Base Rate
            let rewardAmount = averageDaily / dailyLimit;

            // 4. Overrides & Caps
            if (unlockPrice < 5) {
                // Tier 1 ($0 - $5)
                if (unlockPrice > 3) {
                    rewardAmount = 0.0152; // Starter Node exact lock
                } else {
                    rewardAmount = 0.0152;
                }
            }

            // Cap for Starter Nodes
            if (unlockPrice < 20 && rewardAmount > 0.02) {
                rewardAmount = 0.0200;
            }

            // Floor
            if (rewardAmount < 0.01) {
                rewardAmount = 0.0152;
            }

            // Rounding
            rewardAmount = parseFloat(rewardAmount.toFixed(4));

            console.log(`Plan [${plan.name}] Price: ${plan.unlock_price} (USD est: ${unlockPrice.toFixed(2)}) -> New Reward: ${rewardAmount} (Old: ${plan.task_reward})`);

            // UPDATE
            plan.task_reward = rewardAmount;
            await plan.save();
        }

        console.log('All plans updated successfully.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

updateRewards();
