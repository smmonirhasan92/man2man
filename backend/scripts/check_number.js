require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const Plan = require('../modules/admin/PlanModel'); // Ensure this model is loaded

const checkNumber = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB: ${uri}`);

        const target = "3249";
        console.log(`Searching for number ending in: ${target}`);

        // Search in UserPlans
        const plans = await UserPlan.find({
            syntheticPhone: { $regex: target, $options: 'i' }
        }).populate('planId'); // Populate the reference

        if (plans.length === 0) {
            console.log(`❌ No Plan found matching *${target}*`);
        } else {
            console.log(`\n✅ FOUND ${plans.length} MATCHES:`);
            plans.forEach(plan => {
                console.log(`\n-----------------------------------`);
                console.log(`Number: ${plan.syntheticPhone}`);
                console.log(`Plan ID (Active): ${plan.planId?._id}`);
                console.log(`Plan Name (Active): ${plan.planName}`);
                console.log(`Reference Plan Name: ${plan.planId?.name}`);
                console.log(`Daily Limit: ${plan.dailyLimit}`);
                console.log(`Earnings Today: $${plan.earnings_today}`);

                if (plan.planId) {
                    const p = plan.planId;
                    const total = p.unlock_price * (p.roi_percentage / 100);
                    const daily = total / p.validity_days;
                    console.log(`[Config] Price:$${p.unlock_price} ROI:${p.roi_percentage}% Days:${p.validity_days}`);
                    console.log(`[Math] Daily Goal Should Be: $${daily.toFixed(4)}`);

                    // Calc remaining
                    const remainingBudget = Math.max(0, daily - (plan.earnings_today || 0));
                    const remainingTasks = Math.max(1, plan.dailyLimit - plan.tasksCompletedToday);
                    const nextReward = remainingBudget / remainingTasks;

                    console.log(`[Forecast] Remaining Budget: $${remainingBudget.toFixed(4)}`);
                    console.log(`[Forecast] Next Reward Est: $${nextReward.toFixed(4)}`);
                } else {
                    console.log("⚠️ Reference Plan is Missing/Null");
                }
                console.log(`-----------------------------------`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkNumber();
