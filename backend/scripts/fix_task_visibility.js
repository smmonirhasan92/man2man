const mongoose = require('mongoose');

// Default URI (Local)
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function fixVisibility() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);

        const TaskAd = mongoose.model('TaskAd', new mongoose.Schema({ server_id: String, title: String }, { strict: false }), 'taskads');
        const Plan = mongoose.model('Plan', new mongoose.Schema({ name: String, server_id: String }, { strict: false }), 'plans');

        // 1. Find the Target Server ID (from Starter Plan)
        // Usually 'Starter Node US' or similar
        const starterPlan = await Plan.findOne({ name: { $regex: /Starter|Basic|Free/i } });

        let targetId = 'SERVER_01'; // Default
        if (starterPlan && starterPlan.server_id) {
            targetId = starterPlan.server_id;
            console.log(`Found Starter Plan: ${starterPlan.name} -> Using Server ID: ${targetId}`);
        } else {
            console.log(`Starter Plan not found. Defaulting to ${targetId}`);
        }

        // 2. Update ALL Tasks to this ID
        const result = await TaskAd.updateMany({}, { $set: { server_id: targetId, is_active: true } });
        console.log(`Updated ${result.modifiedCount} Tasks to Server ID: ${targetId}`);

        // 3. Verify
        const tasks = await TaskAd.find({ server_id: targetId });
        console.log(` Verified: ${tasks.length} tasks are now visible on ${targetId}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixVisibility();
