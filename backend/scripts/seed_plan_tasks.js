const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function seedPlanTasks() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Get Plans
        const plans = await Plan.find({}).sort({ unlock_price: 1 });
        if (plans.length < 2) {
            console.log("Not enough plans found. Need at least 2.");
            process.exit();
        }

        const standardPlan = plans[0]; // Cheapest
        const premiumPlan = plans[1];  // More Expensive

        console.log(`Mapping Tasks...`);
        console.log(` - Standard Plan: ${standardPlan.name} (${standardPlan._id})`);
        console.log(` - Premium Plan: ${premiumPlan.name} (${premiumPlan._id})`);

        // 2. Get Tasks
        const allTasks = await TaskAd.find({});
        console.log(`Found ${allTasks.length} tasks.`);

        // 3. Assign
        // Assign first half to Standard
        // Assign second half to Premium
        // (Or duplicate them if we want same tasks but separated logic)

        let count = 0;
        for (let i = 0; i < allTasks.length; i++) {
            const task = allTasks[i];

            // Logic: Assign proper tasks to adequate plans.
            // Problem: User runs out of tasks.
            // Fix: All existing tasks are valid for BOTH plans for now (shared pool), OR we duplicate.
            // Let's make them valid for BOTH to ensure volume (25 tasks > 20 limit).
            // BUT differentiate titles dynamically? No, just enable for both.

            task.valid_plans = [standardPlan._id, premiumPlan._id];

            // Clean title tag
            let cleanTitle = task.title.replace(/\[.*?\]\s*/, '');
            task.title = cleanTitle;

            await task.save();
            count++;

            await task.save();
            count++;
        }

        console.log(`Updated ${count} tasks with Plan IDs.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seedPlanTasks();
