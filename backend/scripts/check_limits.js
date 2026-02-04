const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../modules/admin/PlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function checkLimits() {
    try {
        await mongoose.connect(MONGO_URI);
        const plans = await Plan.find({}).sort({ unlock_price: 1 });
        const fs = require('fs');
        const path = require('path');
        const outputPath = path.join(__dirname, '../../logs/plan_limits.json');

        const outputData = plans.map(p => ({
            name: p.name,
            id: p._id,
            server_id: p.server_id,
            unlock_price: p.unlock_price,
            daily_limit: p.daily_limit,
            db_reward: p.task_reward
        }));

        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`Plan limits written to ${outputPath}`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkLimits();
