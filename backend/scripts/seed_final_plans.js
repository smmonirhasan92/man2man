const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('../kernel/database');
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');

const PLANS = [
    {
        node_code: 'PLAN_V2_01',
        name: 'Nano Node',
        price: 260,
        daily_limit: 5,
        task_reward: 3.9,
        validity_days: 16,
        server_id: 'SERVER_01'
    },
    {
        node_code: 'PLAN_V2_02',
        name: 'Lite Node',
        price: 495,
        daily_limit: 7,
        task_reward: 5.2,
        validity_days: 18,
        server_id: 'SERVER_02'
    },
    {
        node_code: 'PLAN_V2_03',
        name: 'Turbo Node',
        price: 750,
        daily_limit: 7,
        task_reward: 5.5,
        validity_days: 24,
        server_id: 'SERVER_03'
    },
    {
        node_code: 'PLAN_V2_04',
        name: 'Ultra Node',
        price: 1100,
        daily_limit: 8,
        task_reward: 5.7,
        validity_days: 30,
        server_id: 'SERVER_04'
    },
    {
        node_code: 'PLAN_V2_05',
        name: 'Omega Node',
        price: 1450,
        daily_limit: 9,
        task_reward: 5.9,
        validity_days: 35,
        server_id: 'SERVER_05'
    }
];

const seed = async () => {
    try {
        await connectDB();
        console.log("Connected to DB, initiating Final Plans seed...");

        let results = [];
        for (let i = 0; i < PLANS.length; i++) {
            const p = PLANS[i];
            
            const totalReturn = p.daily_limit * p.task_reward * p.validity_days;
            const roiPercentage = (totalReturn / p.price) * 100;

            const planData = {
                name: p.name,
                type: 'server',
                unlock_price: p.price,
                price_usd: (p.price * 0.02).toFixed(2),
                validity_days: p.validity_days,
                daily_limit: p.daily_limit,
                task_reward: p.task_reward,
                roi_percentage: parseFloat(roiPercentage.toFixed(2)),
                server_id: p.server_id,
                node_code: p.node_code,
                features: [
                    'Dedicated Network Node',
                    `${p.daily_limit} Guaranteed Tasks Daily`,
                    `Total Earn: ${totalReturn % 1 === 0 ? totalReturn : totalReturn.toFixed(1)} NXS`,
                    `Validity: ${p.validity_days} Days`
                ],
                is_active: true
            };

            const updatedPlan = await Plan.findOneAndUpdate(
                { node_code: p.node_code },
                planData,
                { upsert: true, new: true }
            );
            results.push(updatedPlan.name);
            console.log(`Upserted plan: ${updatedPlan.name}`);

            // --- SEED TASKS ---
            const taskCount = await TaskAd.countDocuments({ server_id: updatedPlan.server_id });

            if (taskCount < p.daily_limit) {
                const tasksToSeed = [];
                for (let t = 1; t <= p.daily_limit; t++) {
                    tasksToSeed.push({
                        title: `Sponsored Content ${p.server_id.replace('SERVER_', '#')}-${t}`,
                        url: "https://google.com",
                        imageUrl: "https://via.placeholder.com/150",
                        duration: 10,
                        server_id: updatedPlan.server_id,
                        type: 'ad_view',
                        is_active: true,
                        priority: 100 - t
                    });
                }
                await TaskAd.insertMany(tasksToSeed);
                console.log(`Seeded ${p.daily_limit} Tasks for ${updatedPlan.server_id}`);
            }
        }

        // 🛑 COMPLETELY DELETE OLD PLANS AND THEIR TASKS 🛑
        const unwantedPlans = await Plan.find({ node_code: { $nin: PLANS.map(p => p.node_code) } });
        
        if (unwantedPlans.length > 0) {
            const serverIdsToDelete = unwantedPlans.map(p => p.server_id);
            
            // 1. Delete associated Task Ads
            const taskDeleteResult = await TaskAd.deleteMany({ server_id: { $in: serverIdsToDelete } });
            console.log(`Deleted ${taskDeleteResult.deletedCount} outdated Task Ads associated with deprecated plans.`);
            
            // 2. Delete the Plans themselves
            const planDeleteResult = await Plan.deleteMany({ _id: { $in: unwantedPlans.map(p => p._id) } });
            console.log(`Successfully deleted ${planDeleteResult.deletedCount} completely deprecated plans (e.g. Micro, Basic, Starter).`);
        } else {
             console.log(`No old/conflicting plans found to delete. Database is clean.`);
        }

        console.log(`Success! Final ${results.length} plans are the only ones active in the system.`);
        process.exit(0);

    } catch (e) {
        console.error("Error seeding plans:", e);
        process.exit(1);
    }
};

seed();
