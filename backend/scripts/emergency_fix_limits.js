require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');

const emergencyFix = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Scanning for Broken Limits...`);

        // Find plans with limit <= 1
        const res = await UserPlan.updateMany(
            { status: 'active', dailyLimit: { $lte: 1 } },
            { $set: { dailyLimit: 10 } } // Default to 10
        );

        console.log(`✅ Fixed ${res.modifiedCount} Active Plans (Reset Daily Limit to 10).`);

        // Audit after verification
        const badPlans = await UserPlan.find({ status: 'active', dailyLimit: { $lte: 1 } });
        console.log(`Remaining Broken Plans: ${badPlans.length}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

emergencyFix();
