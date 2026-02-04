require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');

const inspect = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB.`);

        const plans = await UserPlan.find({ status: 'active' }).limit(10).lean();

        plans.forEach((p, i) => {
            console.log(`[${i}] ${p.planName} | Limit:${p.dailyLimit} | Tasks:${p.tasksCompletedToday} | $${p.earnings_today}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

inspect();
