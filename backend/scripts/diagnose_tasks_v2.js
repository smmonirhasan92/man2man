const mongoose = require('mongoose');

// Default URI (Local)
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function diagnose() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);

        // Define schemas again for safety
        const TaskAd = mongoose.model('TaskAd', new mongoose.Schema({ server_id: String, title: String, is_active: Boolean }, { strict: false }), 'taskads');
        const Plan = mongoose.model('Plan', new mongoose.Schema({ name: String, server_id: String, is_active: Boolean }, { strict: false }), 'plans');

        const plans = await Plan.find({});
        console.log(`\n--- PLANS (${plans.length}) ---`);
        plans.forEach(p => console.log(`[PLAN] ${p.name} -> Server: ${p.server_id}`));

        const tasks = await TaskAd.find({});
        console.log(`\n--- TASKS (${tasks.length}) ---`);
        const taskCounts = {};
        tasks.forEach(t => {
            taskCounts[t.server_id] = (taskCounts[t.server_id] || 0) + 1;
        });

        console.log("Task Distribution by Server ID:");
        console.table(taskCounts);

        console.log("\n--- MISMATCH CHECK ---");
        const planServerIds = new Set(plans.map(p => p.server_id));
        const taskServerIds = Object.keys(taskCounts);

        const tasksWithoutPlan = taskServerIds.filter(id => !planServerIds.has(id));
        const plansWithoutTasks = [...planServerIds].filter(id => !taskServerIds.includes(id));

        if (tasksWithoutPlan.length > 0) {
            console.log("⚠️  CRITICAL: Tasks exist for these IDs, but NO PLAN uses them:", tasksWithoutPlan);
            console.log("   -> Users buying plans won't see these tasks!");
        }

        if (plansWithoutTasks.length > 0) {
            console.log("⚠️  CRITICAL: Plans allow access to these IDs, but NO TASKS exist:", plansWithoutTasks);
            console.log("   -> Users on these plans will see EMPTY lists!");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

diagnose();
