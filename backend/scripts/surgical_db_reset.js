const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const connectDB = require('../kernel/database');
const StakingPool = require('../modules/staking/StakingPoolModel');
const UserStake = require('../modules/staking/UserStakeModel');

async function executeSurgicalReset() {
    try {
        await connectDB();
        console.log("Connected to Targeted Database...");

        console.log("Purging all legacy investment tables (StakingPools & UserStakes)...");
        await StakingPool.deleteMany({});
        await UserStake.deleteMany({});
        
        console.log("Applying strict new Investment Locker tiers...");
        await StakingPool.insertMany([
            { name: 'Starter Tier', durationDays: 10, rewardPercentage: 20, minAmount: 50, badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            { name: 'Growth Tier', durationDays: 20, rewardPercentage: 40, minAmount: 100, badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { name: 'Pro Tier', durationDays: 30, rewardPercentage: 43.333334, minAmount: 300, badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
        ]);

        console.log("Surgical Reset Complete. Zero deviance. User documents completely untouched.");
        process.exit(0);
    } catch (e) {
        console.error("FATAL DEPLOYMENT ERROR:", e);
        process.exit(1);
    }
}
executeSurgicalReset();
