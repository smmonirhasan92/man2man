const mongoose = require('mongoose');
const path = require('path');
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');
const envPath = path.resolve(__dirname, '../.env');
console.log("Loading .env from:", envPath);
require('dotenv').config({ path: envPath });
console.log("MONGO_URI:", process.env.MONGO_URI ? "Found" : "Not Found");

const TIERS = [
    { price: 500, roi: 1.50, tasks: 15, name: "Starter Node US1" },
    { price: 1000, roi: 1.55, tasks: 14, name: "Basic Node US2" },
    { price: 2000, roi: 1.60, tasks: 13, name: "Standard Node CA1" },
    { price: 3000, roi: 1.65, tasks: 12, name: "Enhanced Node CA2" },
    { price: 4000, roi: 1.68, tasks: 11, name: "Advanced Node UK1" },
    { price: 5000, roi: 1.70, tasks: 10, name: "Pro Node UK2" }, // 10k threshold in prompt was for 7 tasks, adjusting curve
    { price: 7000, roi: 1.75, tasks: 9, name: "Elite Node IE1" },
    { price: 8500, roi: 1.78, tasks: 8, name: "Enterprise Node IE2" },
    { price: 10000, roi: 1.80, tasks: 7, name: "Ultimate Cluster IE3" }
];

const CYCLE_DAYS = 35;
const BASE_TASK_REWARD = 2.0; // Assumption, or we can set it so multiplier is cleaner

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
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
        // Calculation
        // Total Expected Revenue = Price * ROI
        // Daily Revenue = Total / 35
        // Reward Per Task = Daily / Tasks
        // Multiplier = Reward Per Task / BASE_TASK_REWARD

        const totalRevenue = tier.price * tier.roi;
        const dailyRevenue = totalRevenue / CYCLE_DAYS;
        const targetRewardPerTask = dailyRevenue / tier.tasks;
        const multiplier = targetRewardPerTask / BASE_TASK_REWARD;

        const nodeCode = tier.price >= 7000 ? 'PREMIUM_CLUSTER' : tier.price >= 3000 ? 'ADVANCED_NODE' : 'STD_NODE';

        const planData = {
            name: tier.name,
            type: 'server',
            price: tier.price, // Stored in 'price' (virtual) or separate field if schema differs, logic below
            unlock_price: tier.price, // Using unlock_price as the cost
            daily_limit: tier.tasks,
            task_reward: BASE_TASK_REWARD, // Base
            reward_multiplier: parseFloat(multiplier.toFixed(4)),
            validity_days: CYCLE_DAYS,
            node_code: nodeCode,
            description: `ROI: ${(tier.roi * 100).toFixed(0)}% | ${tier.tasks} Tasks/Day`,
            features: [
                `${tier.tasks} Premium Tasks`,
                `ROI ${(tier.roi * 100).toFixed(0)}%`,
                `${CYCLE_DAYS} Days Validity`,
                `Node: ${nodeCode}`
            ]
        };

        // Note: PlanModel might use 'unlock_price' or 'price'. 
        // We will set both if schema allows, or relies on my knowledge of PlanModel.
        // Looking at PlanModel, it has 'unlock_price' and 'price_usd'. 
        // I'll assume 'unlock_price' is the BDT price based on context.

        await Plan.create(planData);
        console.log(`Created: ${tier.name} @ ৳${tier.price} | Mult: x${multiplier.toFixed(2)} | Daily: ৳${dailyRevenue.toFixed(2)}`);
    }

    console.log("Seeding 20 High-End Tasks (Generic)...");
    await TaskAd.deleteMany({});

    // Seed 20 Tasks
    const techGiants = ['NVIDIA', 'Tesla', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Intel', 'AMD', 'Oracle', 'IBM', 'Salesforce', 'Cisco', 'Uber', 'Airbnb', 'Spotify', 'Shopify', 'Zoom'];

    const tasks = techGiants.map((name, i) => ({
        title: `${name} Cloud Verify`,
        description: `Validate ${name} Server Metrics`,
        reward: BASE_TASK_REWARD, // Base Reward
        timer: 10,
        type: 'ad_view',
        priority: 100 - i,
        is_active: true,
        // We can create tasks that are "Universal" so they apply to all nodes
    }));

    await TaskAd.insertMany(tasks);
    console.log("20 Tasks Seeded.");

    console.log("Seeding Complete.");
    process.exit();
};

seedPlans();
