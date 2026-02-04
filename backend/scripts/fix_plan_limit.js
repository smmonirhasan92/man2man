require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');

const fixPlan = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Fixing 'Ultimate Cluster IE3'...`);

        // 1. Fix the Plan Definition
        const res = await Plan.updateMany(
            { name: { $regex: 'Cluster', $options: 'i' } },
            { $set: { daily_ad_limit: 7 } } // Set to 7 as per screenshot
        );
        console.log(`✅ Updated ${res.modifiedCount} Plan Definitions to Limit=7.`);

        // 2. Fix Active UserPlans (Propagate the fix)
        // We need to find UserPlans that are based on this Plan and update them too
        const plans = await Plan.find({ name: { $regex: 'Cluster', $options: 'i' } });
        const planIds = plans.map(p => p._id);

        const res2 = await UserPlan.updateMany(
            { planId: { $in: planIds } },
            { $set: { dailyLimit: 7 } }
        );
        console.log(`✅ Propagated limit to ${res2.modifiedCount} Active User Plans.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixPlan();
