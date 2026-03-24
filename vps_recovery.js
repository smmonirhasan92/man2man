const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

async function run() {
    try {
        console.log('--- STARTING CONTEXTUAL RECOVERY (SIMPLE URI) ---');
        dotenv.config();
        
        // SIMPLE URI (matching what worked in purge script)
        const uri = "mongodb://127.0.0.1:27017/universal_game_core_v1";
        console.log('Connecting to:', uri);
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB.');

        // 1. RE-SEED PLANS (Account Tiers)
        console.log('1. Seeding Plans...');
        const Plan = require('./modules/admin/PlanModel');
        const PLANS = [
            { price: 500, name: "Student Node", code: "PLAN_V2_01", sid: "SERVER_01" },
            { price: 1000, name: "Starter Node", code: "PLAN_V2_02", sid: "SERVER_02" },
            { price: 2000, name: "Basic Node", code: "PLAN_V2_03", sid: "SERVER_03" },
            { price: 3000, name: "Standard Node", code: "PLAN_V2_04", sid: "SERVER_04" },
            { price: 5000, name: "Advanced Node", code: "PLAN_V2_05", sid: "SERVER_05" },
            { price: 7000, name: "Pro Node", code: "PLAN_V2_06", sid: "SERVER_06" },
            { price: 9000, name: "Business Node", code: "PLAN_V2_07", sid: "SERVER_07" },
            { price: 10000, name: "Enterprise Node", code: "PLAN_V2_08", sid: "SERVER_08" },
            { price: 12000, name: "Corporate Node", code: "PLAN_V2_09", sid: "SERVER_09" },
            { price: 15000, name: "Tycoon Node", code: "PLAN_V2_10", sid: "SERVER_10" }
        ];

        for (let i = 0; i < PLANS.length; i++) {
            const p = PLANS[i];
            const roi = 1.6;
            const days = 35;
            const tasks = 10;
            const totalReturn = p.price * roi;
            const daily = totalReturn / days;
            const perTask = daily / tasks;

            await Plan.findOneAndUpdate(
                { node_code: p.code },
                {
                    name: `${p.name} (${p.price} BDT)`,
                    type: 'server',
                    unlock_price: p.price,
                    price_usd: (p.price / 120).toFixed(2),
                    validity_days: days,
                    daily_limit: tasks,
                    task_reward: parseFloat(perTask.toFixed(4)),
                    roi_percentage: roi * 100,
                    server_id: p.sid,
                    node_code: p.code,
                    is_active: true,
                    features: ['Dedicated v2 Server', '10 Tasks Daily', 'High ROI', '24/7 Support']
                },
                { upsert: true }
            );
        }
        console.log('✅ Plans Restored.');

        // 2. RE-SEED TASKS
        console.log('2. Seeding Tasks...');
        const TaskAd = require('./modules/task/TaskAdModel');
        await TaskAd.deleteMany({}); // Wipe tasks to re-seed clean
        
        const allPlans = await Plan.find({});
        console.log(`Found ${allPlans.length} plans to generate tasks from.`);
        for (const plan of allPlans) {
            const tasksToCreate = [];
            const taskReward = plan.task_reward || 0.1;
            for (let i = 1; i <= plan.daily_limit; i++) {
                tasksToCreate.push({
                    title: `${plan.name} Optimization - Task ${i}`,
                    url: "https://google.com",
                    duration: 10,
                    reward_amount: taskReward,
                    type: 'ad_view',
                    valid_plans: [plan._id],
                    is_active: true
                });
            }
            if (tasksToCreate.length > 0) {
                await TaskAd.insertMany(tasksToCreate);
            }
        }
        console.log('✅ Tasks Restored.');

        // 3. RE-SEED STAKING
        console.log('3. Seeding Staking Pools...');
        const StakingService = require('./modules/staking/StakingService');
        await StakingService.seedDefaultPools();
        console.log('✅ Staking Pools Restored.');

        console.log('--- RECOVERY COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ RECOVERY ERROR:', err);
        process.exit(1);
    }
}
run();
