require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const User = require('../modules/user/UserModel');

const debugPlan = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB: ${uri}`);
        console.log("Searching for 'user6'...");

        // 1. Find User
        const user = await User.findOne({ username: { $regex: 'user6', $options: 'i' } });
        if (!user) {
            console.log("❌ User 'user6' not found.");
            process.exit(0);
        }
        console.log(`✅ Found User: ${user.username} (${user._id})`);

        // 2. Find Active Plan
        const plan = await UserPlan.findOne({ userId: user._id, status: 'active' }).populate('planId');
        if (!plan) {
            console.log("❌ No Active Plan found for this user.");
        } else {
            console.log(`\n--- PLAN DEBUG INFO ---`);
            console.log(`Plan Name: ${plan.planName}`);
            console.log(`Daily Limit (Tasks): ${plan.dailyLimit}`);
            console.log(`Tasks Completed Today: ${plan.tasksCompletedToday}`);
            console.log(`Earnings Today: $${plan.earnings_today}`);
            console.log(`Synthetic Phone: ${plan.syntheticPhone}`);

            console.log(`\n--- REFERENCE PLAN MODEL ---`);
            if (plan.planId) {
                console.log(`Ref Name: ${plan.planId.name}`);
                console.log(`Unlock Price: $${plan.planId.unlock_price}`);
                console.log(`ROI %: ${plan.planId.roi_percentage}`);
                console.log(`Validity Days: ${plan.planId.validity_days}`);

                const totalTarget = plan.planId.unlock_price * (plan.planId.roi_percentage / 100);
                const dailyGoal = totalTarget / plan.planId.validity_days;
                console.log(`CALCULATED TARGETS: Total=$${totalTarget}, Daily=$${dailyGoal.toFixed(4)}`);
            } else {
                console.log("❌ Reference Plan Document Missing (Broken Link)");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugPlan();
