require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');

const seedArchitecture = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
        await mongoose.connect(uri);
        console.log(`🔥 Connected to DB. Configuring 10-Server Architecture...`);

        // 1. Define Server IDs
        const serverIds = [];
        for (let i = 1; i <= 10; i++) {
            serverIds.push(`SERVER_${String(i).padStart(2, '0')}`);
        }
        console.log("Servers:", serverIds);

        // 2. Assign Plans to Servers (Round Robin)
        const plans = await Plan.find({});
        console.log(`Found ${plans.length} Plans. Assigning Server IDs...`);

        for (let i = 0; i < plans.length; i++) {
            const plan = plans[i];
            const assignedServer = serverIds[i % serverIds.length];
            plan.server_id = assignedServer;
            await plan.save();
            console.log(` -> Plan '${plan.name}' linked to ${assignedServer}`);
        }

        // 3. Clear Existing Tasks
        await TaskAd.deleteMany({});
        console.log("Existing Tasks Cleared.");

        // 4. Generate 200 Tasks (20 per Server ID)
        console.log("Generating 200 Tasks...");
        const tasks = [];

        for (const serverId of serverIds) {
            for (let j = 1; j <= 20; j++) {
                tasks.push({
                    title: `Premium Ad Stream [${serverId}] - Block ${j}`,
                    url: "https://google.com",
                    thumbnail: `https://picsum.photos/seed/${serverId}_${j}/400/200`,
                    duration: 10 + Math.floor(Math.random() * 5),
                    reward_amount: 0.50, // Placeholder, real reward comes from Plan ROI
                    priority: 20 - j,
                    type: 'ad_view',
                    server_id: serverId, // STRICT BINDING
                    is_active: true
                });
            }
        }

        await TaskAd.insertMany(tasks);
        console.log(`✅ Successfully seeded ${tasks.length} tasks across 10 Server Groups.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedArchitecture();
