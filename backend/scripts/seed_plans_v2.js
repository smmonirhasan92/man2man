const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');

// Hardcoded for reliability in script execution
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

// Configuration
const PLANS = [
    { price: 500, name: "Student Node" },
    { price: 1000, name: "Starter Node" },
    { price: 2000, name: "Basic Node" },
    { price: 3000, name: "Standard Node" },
    { price: 5000, name: "Advanced Node" },
    { price: 7000, name: "Pro Node" },
    { price: 9000, name: "Business Node" },
    { price: 10000, name: "Enterprise Node" },
    { price: 12000, name: "Corporate Node" },
    { price: 15000, name: "Tycoon Node" }
];

const VALIDITY_DAYS = 35;
const ROI_MULTIPLIER = 1.6; // 160%
const DAILY_TASKS = 10;

async function seedPlans() {
    try {
        console.log("🚀 Connecting to MongoDB (Direct)...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected (Direct).");

        console.log(`\n--- PREPARING SAFE-PATCH UPDATE ---`);
        console.log(`Generating ${PLANS.length} Plans`);
        console.log(`Config: ${VALIDITY_DAYS} Days | ${ROI_MULTIPLIER}x ROI | ${DAILY_TASKS} Tasks/Day`);

        for (let i = 0; i < PLANS.length; i++) {
            const p = PLANS[i];
            const planId = `PLAN_V2_${String(i + 1).padStart(2, '0')}`;

            // Calculate Math
            const totalReturn = p.price * ROI_MULTIPLIER;
            const dailyRevenue = totalReturn / VALIDITY_DAYS;
            const perTaskReward = dailyRevenue / DAILY_TASKS;

            const planData = {
                name: `${p.name} (${p.price} BDT)`,
                type: 'server',
                unlock_price: p.price,
                price_usd: (p.price / 120).toFixed(2), // Approx USD for display
                validity_days: VALIDITY_DAYS,
                daily_limit: DAILY_TASKS,
                task_reward: parseFloat(perTaskReward.toFixed(4)), // PRE-CALCULATED PRECISION
                roi_percentage: ROI_MULTIPLIER * 100,
                server_id: `SERVER_${String(i + 1).padStart(2, '0')}`, // Unique Server Group per Plan
                node_code: planId,
                features: [
                    'Dedicated v2 Server',
                    `${DAILY_TASKS} Tasks Daily`,
                    `Total Return: ${totalReturn.toFixed(0)} BDT`,
                    '24/7 Support'
                ],
                is_active: true
            };

            // Upsert
            await Plan.findOneAndUpdate(
                { node_code: planId },
                planData,
                { upsert: true, new: true }
            );

            console.log(`✅ Upserted: ${planData.name} | Reward/Task: ${planData.task_reward}`);
        }

        console.log("\n✨ Safe-Patch Deployment Complete.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }
}

seedPlans();
