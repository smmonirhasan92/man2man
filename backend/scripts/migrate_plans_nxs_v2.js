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

            // [FIX] Detect legacy BDT-scale prices (e.g. 1000, 2500, 5000 BDT)
            // These are large round numbers that haven't been converted to NXS yet.
            // Threshold: >= 500 AND a round multiple of 500 AND currently below NXS range (< 300 NXS after /120 = < 36000 BDT)
            const isBdtPrice = usdPrice >= 500 && usdPrice % 500 === 0 && usdPrice < 36000;
            if (isBdtPrice) {
                usdPrice = usdPrice / 120; // Convert BDT back to approximate USD
                console.log(`Detected legacy BDT price. Converted to ~$${usdPrice.toFixed(2)} USD`);
            }

            // Convert raw USD scalar amounts (like 8.5, 42) into absolute NXS units
            // Only migrate if currently below the NXS range (i.e., still in raw USD form)
            if (usdPrice > 0 && usdPrice < 300) {
                plan.unlock_price = Math.round(usdPrice * NXS_PER_USD);
                console.log(`Migrated price -> ${plan.unlock_price} NXS`);
            } else {
                console.log(`Skipping price migration for plan '${plan.name}' (price: ${plan.unlock_price} - already migrated or invalid)`);
            }

            if (usdReward && usdReward < 2.0) {
                plan.task_reward = Number((usdReward * NXS_PER_USD).toFixed(2));
                console.log(`Migrated reward -> ${plan.task_reward} NXS`);
            } else if (!usdReward) {
                plan.task_reward = 2.5; // Starter default
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
