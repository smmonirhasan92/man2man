const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');

async function fix() {
    await mongoose.connect(process.env.DB_URI);

    const plans = await Plan.find();
    console.log("==== PLANS ====");
    plans.forEach(p => {
        console.log(`- ${p.plan_name} | ID: ${p.server_id} | Price: $${p.price_usd} / ${p.unlock_price} NXS`);
    });

    const tasks = await TaskAd.find();
    console.log("\n==== TASKS ====");
    console.log(`Total Tasks: ${tasks.length}`);
    if (tasks.length > 0) {
        let taskServers = [...new Set(tasks.map(t => t.server_id))];
        console.log("Tasks are currently assigned to these server_ids:", taskServers);
    }

    process.exit(0);
}
fix();
