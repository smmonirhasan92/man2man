require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const User = require('../modules/user/UserModel');

const findActiveUser = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB: ${uri}`);
        console.log("Searching for Active Plans...");

        const activePlan = await UserPlan.findOne({ status: 'active' }).populate('userId');

        if (activePlan) {
            console.log("✅ Found Active User:");
            console.log(`User: ${activePlan.userId?.username}`);
            console.log(`ID: ${activePlan.userId?._id}`);
            console.log(`Plan: ${activePlan.planName}`);
            console.log(`Phone: ${activePlan.syntheticPhone}`);
            console.log(`Tasks Today: ${activePlan.tasksCompletedToday}`);
            console.log(`Earnings Today: ${activePlan.earnings_today}`);
        } else {
            console.log("❌ NO ACTIVE PLANS FOUND IN SYSTEM.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

findActiveUser();
