require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const Plan = require('../modules/admin/PlanModel');
const TaskService = require('../modules/task/TaskService');

const verifyReward = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/man2man');
        console.log("🔥 Connected to DB. Simulating Task Reward Calculation...");

        // 1. Get Plan Details (Hypothetical)
        const unlockPrice = 10;
        const roiPercent = 150;
        const validityDays = 35;
        const totalTarget = unlockPrice * (roiPercent / 100); // 15
        const dailyGoal = totalTarget / validityDays; // 0.4285

        console.log(`\n--- EXPECTED VALUES ---`);
        console.log(`Total Target: $${totalTarget}`);
        console.log(`Daily Goal: $${dailyGoal.toFixed(4)}`);
        console.log(`Per 15 Tasks Avg: $${(dailyGoal / 15).toFixed(4)}`);

        // 2. Real Check via TaskService Logic (We can't call internal service directly without user context, so we read code logic via node execution of snippet)

        // Let's check existing Plans to ensure fields are correct
        const plan = await Plan.findOne({ name: 'Starter Node' });
        if (plan) {
            console.log(`\n--- REAL PLAN DATA: Starter Node ---`);
            console.log(`Unlock Price: ${plan.unlock_price}`);
            console.log(`ROI: ${plan.roi_percentage}%`);
            console.log(`Validity: ${plan.validity_days}`);
            const realDaily = (plan.unlock_price * (plan.roi_percentage / 100)) / plan.validity_days;
            console.log(`CALCULATED DAILY LIMIT: $${realDaily.toFixed(4)}`);
        } else {
            console.log("❌ Starter Node Plan not found in DB.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyReward();
