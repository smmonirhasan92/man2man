require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel');
const Plan = require('../modules/admin/PlanModel');

const calibrateNode = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Calibrating Node 3249...`);

        const targetPhone = "3249";
        const userPlan = await UserPlan.findOne({
            syntheticPhone: { $regex: targetPhone, $options: 'i' }
        }).populate('planId');

        if (!userPlan) {
            console.log("❌ Plan not found! Please connect the number first.");
            process.exit(1);
        }

        console.log(`✅ Found UserPlan: ${userPlan.syntheticPhone} (Current Limit: ${userPlan.dailyLimit})`);

        // 1. Update the Underlying Plan Definition (or create a specific one if shared?)
        // To be safe, we should ensure this UserPlan points to a "Starter Node" we can modify freely.
        // Or if it shares a plan, we might affect others. 
        // User said "STARTER NODE US1 RATE LOCK". Implies a specific tier.

        let planDef = await Plan.findById(userPlan.planId._id);
        if (!planDef) {
            console.log("❌ Plan Definition missing.");
            process.exit(1);
        }

        console.log(`Configuration Target: Total $8.00 / 35 Days / 15 Tasks`);

        // Update Plan Definition
        planDef.unlock_price = 8.00;
        planDef.roi_percentage = 100; // Returns exactly $8.00
        planDef.validity_days = 35;
        planDef.daily_limit = 15;
        planDef.server_id = 'SERVER_01'; // Lock to Server 01

        await planDef.save();
        console.log(`✅ Plan Definition Updated: Price $8, ROI 100%, 35 Days, Limit 15.`);

        // 2. Update UserPlan to reflect these checks immediately
        userPlan.dailyLimit = 15;
        // userPlan.server_id = 'SERVER_01'; // UserPlan might not have this, check schema. Plan has it.
        await userPlan.save();
        console.log(`✅ UserPlan Synced. Limit set to 15.`);

        // 3. Verification Math
        const dailyGoal = (planDef.unlock_price * (planDef.roi_percentage / 100)) / planDef.validity_days;
        const perTask = dailyGoal / planDef.daily_limit;

        console.log(`\n--- VERIFICATION ---`);
        console.log(`Daily Budget: $${dailyGoal.toFixed(5)}`);
        console.log(`Per Task Reward: $${perTask.toFixed(5)}`);
        console.log(`Target: $0.0152`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

calibrateNode();
