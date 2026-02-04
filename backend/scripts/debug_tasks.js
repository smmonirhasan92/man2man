const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel'); // Check user plans too

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function inspectData() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log("--- PLANS ---");
        const plans = await Plan.find({});
        plans.forEach(p => console.log(`Plan: ${p.name} (_id: ${p._id})`));

        console.log("\n--- TASKS ---");
        const tasks = await TaskAd.find({}).limit(5);
        let fixedCount = 0;
        for (const t of tasks) {
            console.log(`Task: ${t.title} | Active: ${t.is_active}`);
            if (!t.is_active) {
                t.is_active = true;
                await t.save();
                fixedCount++;
            }
        }
        console.log(` -> Fixed ${fixedCount} individual tasks.`);

        // Bulk fix rest
        // Bulk fix rest
        const res = await TaskAd.updateMany({ is_active: { $ne: true } }, { $set: { is_active: true } });
        console.log(`Ran bulk update. Modified: ${res.modifiedCount}`);

        const activeCount = await TaskAd.countDocuments({ is_active: true });
        console.log(`\n--- VERIFICATION: Active Tasks in DB: ${activeCount} ---`);

        console.log("\n--- USER 'test55' ACTIVE PLANS ---");
        const user = await require('../modules/user/UserModel').findOne({ username: 'test55' });
        if (user) {
            const userPlans = await UserPlan.find({ userId: user._id, status: 'active' });
            userPlans.forEach(up => {
                console.log(`UserPlan: PlanID=${up.planId}, SyntheticPhone=${up.syntheticPhone}`);
            });
        } else {
            console.log("User test55 not found.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

inspectData();
