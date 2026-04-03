const mongoose = require('mongoose');
const path = require('path');
const Plan = require('./modules/admin/PlanModel');
const TaskAd = require('./modules/task/TaskAdModel');
// require('dotenv').config(); // Disabled to prevent overwriting Docker env vars
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://mongodb:27017/universal_game_core_v1?replicaSet=rs0";

const TIERS = [
    { 
        id: "69abf42bcbcbe9e9cba676ab",
        name: "Micro Node", 
        price: 250, 
        price_usd: 5,
        tasks: 5, 
        reward: 4.5, 
        validity: 15,
        server_id: "SERVER_01"
    },
    { 
        id: "69abf42bcbcbe9e9cba676ac",
        name: "Starter Node", 
        price: 350, 
        price_usd: 7,
        tasks: 5, 
        reward: 4.8, 
        validity: 20,
        server_id: "SERVER_02"
    },
    { 
        id: "69abf42bcbcbe9e9cba676ad",
        name: "Basic Node", 
        price: 500, 
        price_usd: 10,
        tasks: 8, 
        reward: 3.5, 
        validity: 25,
        server_id: "SERVER_03"
    },
    { 
        id: "69abf42bcbcbe9e9cba676ae",
        name: "Pro Node", 
        price: 750, 
        price_usd: 15,
        tasks: 10, 
        reward: 3.2, 
        validity: 30,
        server_id: "SERVER_04"
    },
    { 
        id: "69abf42bcbcbe9e9cba676af",
        name: "Max Node", 
        price: 1000, 
        price_usd: 20,
        tasks: 12, 
        reward: 3.2, 
        validity: 35,
        server_id: "SERVER_05"
    }
];

const BASE_TASK_REWARD = 2.0;

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://mongodb:27017/universal_game_core_v1?replicaSet=rs0";
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
        const planData = {
            _id: tier.id,
            name: tier.name,
            type: 'server',
            unlock_price: tier.price,
            price_usd: tier.price_usd,
            daily_limit: tier.tasks,
            task_reward: tier.reward,
            reward_multiplier: 1, // Using direct reward for local sim
            validity_days: tier.validity,
            server_id: tier.server_id,
            is_active: true,
            features: [
                `${tier.tasks} Daily Tasks`,
                `Earnings: ${tier.reward} NXS/Task`,
                `${tier.validity} Days Validity`,
                `Server ID: ${tier.server_id}`
            ]
        };

        try {
            console.log("Creating Plan:", planData.name);
            await Plan.create(planData);
        } catch (e) {
            console.error(`ERROR creating ${tier.name}:`, e.message);
        }
    }

    console.log("Seeding 20 High-End Tasks...");
    await TaskAd.deleteMany({});

    // Seed 20 Tasks
    const techGiants = ['NVIDIA', 'Tesla', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Intel', 'AMD', 'Oracle', 'IBM', 'Salesforce', 'Cisco', 'Uber', 'Airbnb', 'Spotify', 'Shopify', 'Zoom'];

    const tasks = techGiants.map((name, i) => ({
        title: `${name} Cloud Verify`,
        url: 'https://google.com',
        imageUrl: 'https://cdn-icons-png.flaticon.com/512/270/270798.png', 
        duration: 10,
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
