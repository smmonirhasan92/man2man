const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

const connectDB = require('./backend/kernel/database');
const StakingPool = require('./backend/modules/staking/StakingPoolModel');
const StakingService = require('./backend/modules/staking/StakingService');

async function migrate() {
    try {
        await connectDB();
        console.log("Connected to DB");
        await StakingPool.deleteMany({});
        console.log("Deleted old pools");
        await StakingService.seedDefaultPools();
        console.log("Migration complete");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
