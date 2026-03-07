const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Plan = require('../modules/admin/PlanModel');

// Ensure dotenv points to backend/.env when run from backend/scripts/
dotenv.config({ path: path.join(__dirname, '../.env') });

const NXS_PER_USD = 50;

async function migratePlans() {
    try {
        console.log("Connecting to MongoDB to migrate legacy unlock_price...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const plans = await Plan.find({});
        console.log(`Found ${plans.length} plans.`);

        for (let plan of plans) {
            let usdPrice = plan.unlock_price;
            let usdReward = plan.task_reward;

            // Simple heuristic to detect unmigrated BDT sizes (e.g. 1000, 2500, 5000...)
            if (usdPrice >= 1000 && usdPrice % 100 === 0 && usdPrice !== 5000 && usdPrice !== 10000) {
                usdPrice = usdPrice / 120; // estimate back down to generic USD
            } else if (usdPrice === 1000) {
                usdPrice = 8.5;
            }

            // Convert raw USD scalar amounts (like 8.5, 42) into absolute NXS supply units
            if (usdPrice < 300) {
                plan.unlock_price = Math.round(usdPrice * NXS_PER_USD);
                console.log(`Migrated price -> ${plan.unlock_price} NXS`);
            }

            if (usdReward && usdReward < 2.0) {
                plan.task_reward = Number((usdReward * NXS_PER_USD).toFixed(2));
                console.log(`Migrated reward -> ${plan.task_reward} NXS`);
            } else if (!usdReward) {
                plan.task_reward = 2.5; // Starter 
            }

            await plan.save();
        }

        console.log("Migration Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration Error:", e);
        process.exit(1);
    }
}

migratePlans();
