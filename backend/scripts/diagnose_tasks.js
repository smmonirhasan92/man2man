const mongoose = require('mongoose');

// Default URI (Local) - User can change this to live URI if they want to debug live
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

const TaskAdSchema = new mongoose.Schema({
    server_id: String,
    title: String,
    is_active: Boolean
}, { strict: false });

const PlanSchema = new mongoose.Schema({
    name: String,
    server_id: String,
    is_active: Boolean
}, { strict: false });

const UserPlanSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    planName: String,
    status: String,
    syntheticPhone: String
}, { strict: false });

async function diagnose() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);

        const TaskAd = mongoose.model('TaskAd', TaskAdSchema, 'taskads');
        const Plan = mongoose.model('Plan', PlanSchema, 'plans');

        // Check Plans
        const plans = await Plan.find({});
        console.log(`\n--- PLANS (${plans.length}) ---`);
        plans.forEach(p => console.log(`[${p.is_active ? 'ACTIVE' : 'OFF'}] ${p.name} -> Server: ${p.server_id}`));

        // Check Tasks
        const tasks = await TaskAd.find({});
        console.log(`\n--- TASKS (${tasks.length}) ---`);
        tasks.forEach(t => console.log(`[${t.is_active ? 'ACTIVE' : 'OFF'}] ${t.title} -> Server: ${t.server_id}`));

        if (tasks.length === 0) {
            console.log("\n❌ NO TASKS FOUND! This is why posts are not showing.");
        } else {
            // Check mismatch
            const serverIdsInPlans = new Set(plans.map(p => p.server_id));
            const serverIdsInTasks = new Set(tasks.map(t => t.server_id));

            console.log("\n--- ANALYSIS ---");
            console.log("Plan Server IDs:", [...serverIdsInPlans]);
            console.log("Task Server IDs:", [...serverIdsInTasks]);

            const orphans = [...serverIdsInTasks].filter(id => !serverIdsInPlans.has(id));
            if (orphans.length > 0) console.log("⚠️ Warning: Tasks exist for these Server IDs but no Plans link to them:", orphans);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

diagnose();
