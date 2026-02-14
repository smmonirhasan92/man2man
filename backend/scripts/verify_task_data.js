const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const servers = ['SERVER_01', 'SERVER_02', 'SERVER_03', 'SERVER_04', 'SERVER_05', 'test'];

        console.log("\n--- TASK COUNTS PER SERVER ---");
        for (const srv of servers) {
            const count = await TaskAd.countDocuments({ server_id: srv });
            console.log(`${srv}: ${count} tasks`);
        }

        console.log("\n--- PLAN SERVER MAPPING ---");
        const plans = await Plan.find({ is_active: true });
        for (const p of plans) {
            console.log(`Plan: ${p.name} -> Server: ${p.server_id} (Reward: $${p.task_reward})`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
