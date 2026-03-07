const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Plan = require('./modules/payment/PlanModel');

dotenv.config({ path: path.join(__dirname, '.env') });

const NXS_PER_USD = 50;

async function migratePlans() {
    try {
        console.log("Connecting to MongoDB for NXS Tokenomics Migration...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected Successfully.");

        const plans = await Plan.find({});
        console.log(`Found ${plans.length} total plans to migrate.`);

        for (let plan of plans) {
            // Check if price is suspiciously high (e.g. 1300), implying it was entered as BDT instead of USD
            // Most of our plans were around $20 to $500. If price > 1000, it was likely BDT.

            let usdPrice = plan.price;
            let wasBDT = false;

            // Simple heuristic: if plan price is 1300, 2600, 6500... it's BDT from older logic.
            if (plan.price >= 1300 && plan.price % 100 === 0 && plan.price !== 5000 && plan.price !== 10000) {
                usdPrice = plan.price / 130;  // approximate old rate usd->bdt to find base USD
                wasBDT = true;
            } else if (plan.price === 20.83 || plan.price === 25) {
                usdPrice = 25; // Clean up float pricing to flat USD
            }


            // Calculate the absolute NXS value
            // Price is now entirely tracked in NXS equivalent. (20 USD = 1000 NXS)
            // But we might want to store 'price' as USD and just convert on frontend?
            // User requested: 50 NXS = 1 USD. So a $20 server = 1000 NXS.
            // Let's store 'price' as the NXS amount. This guarantees uniformity.

            const oldPrice = plan.price;
            const newNXSPrice = Math.round(usdPrice * NXS_PER_USD);

            plan.price = newNXSPrice;

            // Adjust dailyLimit (Tasks) and Reward to match 50:1 if applicable?
            // Actually, we'll keep daily limit the same.

            await plan.save();
            console.log(`Migrated [${plan.planName}]: Old Price ${oldPrice}${wasBDT ? ' BDT' : ' USD'} -> New Price: ${newNXSPrice} NXS`);
        }

        console.log("Migration Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration Error:", e);
        process.exit(1);
    }
}

migratePlans();
