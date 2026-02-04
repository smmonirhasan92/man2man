const mongoose = require('mongoose');
require('dotenv').config();
const Plan = require('../modules/admin/PlanModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function listPlans() {
    try {
        await mongoose.connect(MONGO_URI);
        const plans = await Plan.find({});
        plans.forEach(p => console.log(`PLAN: "${p.name}" ID: ${p._id}`));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listPlans();
