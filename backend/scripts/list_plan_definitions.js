require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');

const listPlans = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Plans:`);

        const plans = await Plan.find({ name: /Cluster/i }).lean();

        plans.forEach((p) => {
            const total = (p.unlock_price || 0) * ((p.roi_percentage || 150) / 100);
            const days = p.validity_days || 35;
            const daily = total / days;
            console.log(`[${p.name}] Price:$${p.unlock_price} ROI:${p.roi_percentage}% Days:${days} Limit:${p.daily_ad_limit} -> DailyGoal:$${daily.toFixed(3)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listPlans();
