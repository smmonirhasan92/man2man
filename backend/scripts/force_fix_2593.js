require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');

const forceFix2593 = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Fixing 2593...`);

        const target = "2593";
        const plans = await UserPlan.find({ syntheticPhone: { $regex: target, $options: 'i' } });

        for (const p of plans) {
            console.log(`Found Plan: ${p.syntheticPhone} (Limit: ${p.dailyLimit})`);
            p.dailyLimit = 10;
            await p.save();
            console.log(`✅ Updated Limit to 10.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

forceFix2593();
