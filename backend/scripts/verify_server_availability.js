const mongoose = require('mongoose');
require('dotenv').config();
const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');
const TaskService = require('../modules/task/TaskService');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
const OUTPUT_FILE = path.join(__dirname, '../../logs/server_verification.txt');

async function verifyAllPlans() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const plans = await Plan.find({}).sort({ unlock_price: 1 });
        console.log(`Found ${plans.length} plans. Testing availability...`);

        let output = '---------------------------------------------------\n';
        output += '| Plan Name           | Server ID | Tasks Found | Status |\n';
        output += '---------------------------------------------------\n';

        for (const plan of plans) {
            // Simulate getAvailableTasks
            // passing dummy userId '000000000000000000000000'
            const tasks = await TaskService.getAvailableTasks('000000000000000000000000', plan._id);

            const status = tasks.length > 0 ? '✅ ONLINE' : '❌ OFFLINE';

            const name = plan.name.padEnd(19).substring(0, 19);
            const server = (plan.server_id || 'N/A').padEnd(9);
            // Limit shown is what user sees (capped by daily_limit)
            const count = tasks.length.toString().padEnd(11);

            output += `| ${name} | ${server} | ${count} | ${status} |\n`;
        }
        output += '---------------------------------------------------\n';

        fs.writeFileSync(OUTPUT_FILE, output);
        console.log(`Verification written to ${OUTPUT_FILE}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAllPlans();
