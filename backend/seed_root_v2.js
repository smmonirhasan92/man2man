const mongoose = require('mongoose');
const path = require('path');
// Direct imports from root
const Plan = require('./modules/admin/PlanModel');
const TaskAd = require('./modules/task/TaskAdModel');
require('dotenv').config();

const TIERS = [
    { price: 500, roi: 1.50, tasks: 15, name: "Starter Node US1" },
    { price: 1000, roi: 1.55, tasks: 14, name: "Basic Node US2" },
    { price: 2000, roi: 1.60, tasks: 13, name: "Standard Node CA1" },
    { price: 3000, roi: 1.65, tasks: 12, name: "Enhanced Node CA2" },
    { price: 4000, roi: 1.68, tasks: 11, name: "Advanced Node UK1" },
    { price: 5000, roi: 1.70, tasks: 10, name: "Pro Node UK2" },
    { price: 7000, roi: 1.75, tasks: 9, name: "Elite Node IE1" },
    { price: 8500, roi: 1.78, tasks: 8, name: "Enterprise Node IE2" },
    { price: 10000, roi: 1.80, tasks: 7, name: "Ultimate Cluster IE3" }
];

const CYCLE_DAYS = 35;
const BASE_TASK_REWARD = 2.0;

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

const seedPlans = async () => {
    await connectDB();

    console.log("Clearing existing plans...");
    await Plan.deleteMany({});

    console.log(`Seeding ${TIERS.length} Tiers for 35-Day Cycle...`);

    for (const tier of TIERS) {
        const totalRevenue = tier.price * tier.roi;
        const dailyRevenue = totalRevenue / CYCLE_DAYS;
        const targetRewardPerTask = dailyRevenue / tier.tasks;
        const multiplier = targetRewardPerTask / BASE_TASK_REWARD;

        const nodeCode = tier.price >= 7000 ? 'PREMIUM_CLUSTER' : tier.price >= 3000 ? 'ADVANCED_NODE' : 'STD_NODE';

        const planData = {
            name: tier.name,
            type: 'server',
            unlock_price: tier.price, // BDT Price
            price_usd: parseFloat((tier.price / 120).toFixed(2)), // Approx USD
            daily_limit: tier.tasks,
            task_reward: BASE_TASK_REWARD,
            reward_multiplier: parseFloat(multiplier.toFixed(4)),
            validity_days: CYCLE_DAYS,
            node_code: nodeCode,
            features: [
                `${tier.tasks} Premium Tasks`,
                `ROI ${(tier.roi * 100).toFixed(0)}%`,
                `${CYCLE_DAYS} Days Validity`,
                `Node: ${nodeCode}`
            ]
        };

        try {
            console.log("Creating Plan:", planData.name, "Type:", planData.type);
            const created = await Plan.create(planData);
            console.log(`Created: ${created.name} | Mult: ${created.reward_multiplier}`);
        } catch (e) {
            console.error(`ERROR creating ${tier.name}:`, e.message);
            if (e.errors) {
                Object.keys(e.errors).forEach(key => {
                    console.error(`Verification Error on ${key}: ${e.errors[key].message}`);
                });
            }
        }
    }

    console.log("Seeding 20 High-End Tasks...");
    await TaskAd.deleteMany({});

    // Seed 20 Tasks
    const techGiants = ['NVIDIA', 'Tesla', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Intel', 'AMD', 'Oracle', 'IBM', 'Salesforce', 'Cisco', 'Uber', 'Airbnb', 'Spotify', 'Shopify', 'Zoom'];

    const tasks = techGiants.map((name, i) => ({
        title: `${name} Cloud Verify`,
        description: `Validate ${name} Server Metrics`,
        reward: BASE_TASK_REWARD,
        timer: 10,
        type: 'ad_view',
        priority: 100 - i,
        is_active: true
    }));

    await TaskAd.insertMany(tasks);
    console.log("20 Tasks Seeded.");

    console.log("Seeding Complete (Plans + Tasks).");
    process.exit();
};

seedPlans();
