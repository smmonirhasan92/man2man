const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const connectDB = require('../kernel/database');
const StakingPool = require('../modules/staking/StakingPoolModel');
const StakingService = require('../modules/staking/StakingService');

async function run() {
    try {
        await connectDB();
        console.log("Connected to Production DB for Migration...");
        const oldPoolsCount = await StakingPool.countDocuments();
        console.log(`Deleting ${oldPoolsCount} old pools...`);
        await StakingPool.deleteMany({});
        
        console.log("Seeding New V2 Pools...");
        await StakingService.seedDefaultPools();

        const newPoolsCount = await StakingPool.countDocuments();
        console.log(`Success! Server now has ${newPoolsCount} active high-yield pools.`);
        process.exit(0);
    } catch (e) {
        console.error("Migration Error:", e);
        process.exit(1);
    }
}
run();
