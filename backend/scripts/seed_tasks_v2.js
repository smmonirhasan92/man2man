const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');

// Load env
dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true";
        console.log("Connecting to:", uri.substring(0, 20) + "...");
        await mongoose.connect(uri);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('DB Connection Failed', err);
        process.exit(1);
    }
};

const seedTasks = async () => {
    await connectDB();

    try {
        // 1. Fetch Plans (All)
        const plans = await Plan.find({});
        console.log(`Found ${plans.length} plans in total.`);

        // 2. Clear Existing Tasks (Optional, but cleaner for "Fix This Now" request)
        await TaskAd.deleteMany({});
        console.log("Cleared existing Task Ads.");

        // 3. Generate Tasks for Each Plan
        const tasksPayload = [];

        for (const plan of plans) {
            console.log(`Generating tasks for Plan: ${plan.name} (${plan.type}) - Multiplier: ${plan.reward_multiplier || 1}`);

            // Determine Task Count based on plan limits
            const taskCount = plan.daily_limit || 20; // Default to 20 if undefined

            // Determine Base Reward
            // Goal: ROI 150% over 35 days
            // Revenue = Price * 1.5
            // Daily Revenue = Revenue / 35
            // Per Task = Daily / TaskCount

            const price = plan.price_usd || (plan.price / 120);
            const targetRevenue = price * 1.65; // Aim for 165% (between 150-180)
            const dailyRevenue = targetRevenue / 35;
            const perTaskBase = dailyRevenue / taskCount;

            // Adjust for stored reward_amount (which might be multiplier-agnostic in some logics, but let's be explicit)
            // If TaskService applies multiplier, we should store BASE reward.
            // If TaskService expects FINAL reward, we store calculated.
            // *TaskService.js logic check*: const rewardAmount = parseFloat((rewardAmountBase * multiplier * activityMultiplier).toFixed(4));
            // So we need to store the BASE amount.
            // Base = PerTask / Multiplier

            const baseRewardToStore = perTaskBase / (plan.reward_multiplier || 1.0);

            console.log(`   > Target Rev: $${targetRevenue.toFixed(2)} | Daily: $${dailyRevenue.toFixed(2)} | Per Task (Final): $${perTaskBase.toFixed(4)}`);
            console.log(`   > Storing Base Reward: $${baseRewardToStore.toFixed(5)}`);

            for (let i = 1; i <= taskCount; i++) {
                tasksPayload.push({
                    title: `${plan.name} optimization - Block ${i}`,
                    url: "https://google.com", // Placeholder
                    imageUrl: `https://picsum.photos/seed/${plan.name}${i}/400/200`, // [NEW] Dynamic Image
                    duration: 10 + (i % 5), // Variable duration 10-15s
                    reward_amount: parseFloat(baseRewardToStore.toFixed(5)),
                    priority: plan.price >= 1000 ? 10 : 5, // Higher priority for expensive plans
                    type: 'ad_view',
                    valid_plans: [plan._id], // STRICT LINKING
                    is_active: true
                });
            }
        }

        // 4. Insert Global Tasks (Fallback)
        // Add 5 generic tasks available to everyone (valid_plans empty)
        for (let i = 1; i <= 5; i++) {
            tasksPayload.push({
                title: `Global Network Check ${i}`,
                url: "https://speedtest.net",
                duration: 5,
                reward_amount: 0.001, // Low reward
                priority: 1,
                type: 'ad_view',
                valid_plans: [], // Available to all who fall through filters
                is_active: true
            });
        }

        console.log(`Seeding ${tasksPayload.length} Total Tasks...`);
        await TaskAd.insertMany(tasksPayload);
        console.log("Admin Tasks Seeded Successfully!");

    } catch (e) {
        console.error("Seeding Failed:", e);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedTasks();
