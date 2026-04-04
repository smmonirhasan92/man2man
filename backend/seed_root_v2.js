const mongoose = require('mongoose');
const Plan = require('./modules/admin/PlanModel');
const TaskAd = require('./modules/task/TaskAdModel');
// require('dotenv').config(); // Disabled to prevent overwriting Docker env vars

// =============================================================
// ACCOUNT TIERS — Synced with Live Admin Panel
// Last Updated: 2026-04-04
// =============================================================
const TIERS = [
    {
        id: "69abf42bcbcbe9e9cba676ab",
        name: "Nano Node",
        price: 260,
        price_usd: 5.2,
        tasks: 5,
        reward: 3.9,
        validity: 16,
        server_id: "SERVER_01"
    },
    {
        id: "69abf42bcbcbe9e9cba676ac",
        name: "Lite Node",
        price: 495,
        price_usd: 9.9,
        tasks: 7,
        reward: 5.2,
        validity: 18,
        server_id: "SERVER_02"
    },
    {
        id: "69abf42bcbcbe9e9cba676ad",
        name: "Turbo Node",
        price: 750,
        price_usd: 15,
        tasks: 7,
        reward: 5.5,
        validity: 24,
        server_id: "SERVER_03"
    },
    {
        id: "69abf42bcbcbe9e9cba676ae",
        name: "Ultra Node",
        price: 1100,
        price_usd: 22,
        tasks: 8,
        reward: 5.7,
        validity: 30,
        server_id: "SERVER_04"
    },
    {
        id: "69abf42bcbcbe9e9cba676af",
        name: "Omega Node",
        price: 1450,
        price_usd: 29,
        tasks: 9,
        reward: 5.9,
        validity: 35,
        server_id: "SERVER_05"
    }
];

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://mongodb:27017/universal_game_core_v1?replicaSet=rs0";
        console.log("Connecting to:", uri.substring(0, 50) + "...");
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ DB Connection Failed', err);
        process.exit(1);
    }
};

const seedPlans = async () => {
    await connectDB();

    console.log("\n=== SEEDING ACCOUNT TIERS ===");
    await Plan.deleteMany({});
    console.log("🗑️  Cleared existing plans.\n");

    for (const tier of TIERS) {
        const maxEarn = parseFloat((tier.tasks * tier.reward * tier.validity).toFixed(2));
        try {
            await Plan.create({
                _id: tier.id,
                name: tier.name,
                type: 'server',
                unlock_price: tier.price,
                price_usd: tier.price_usd,
                daily_limit: tier.tasks,
                task_reward: tier.reward,
                reward_multiplier: 1,
                validity_days: tier.validity,
                server_id: tier.server_id,
                is_active: true,
                features: [
                    `${tier.tasks} Daily Tasks`,
                    `${tier.reward} NXS/Task`,
                    `${tier.validity} Days Validity`,
                    `Max Earn: ${maxEarn} NXS`
                ]
            });
            console.log(`  ✅ ${tier.name.padEnd(12)} | ${tier.price} NXS | ${tier.tasks} tasks/day | ${tier.reward} NXS/task | ${tier.validity} days | Max: ${maxEarn} NXS`);
        } catch (e) {
            console.error(`  ❌ ERROR seeding ${tier.name}:`, e.message);
        }
    }

    console.log("\n=== SEEDING TASK ADS (20 Tasks) ===");
    await TaskAd.deleteMany({});

    const techGiants = [
        'NVIDIA', 'Tesla', 'Google', 'Microsoft', 'Amazon',
        'Apple', 'Meta', 'Netflix', 'Adobe', 'Intel',
        'AMD', 'Oracle', 'IBM', 'Salesforce', 'Cisco',
        'Uber', 'Airbnb', 'Spotify', 'Shopify', 'Zoom'
    ];

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
    console.log(`  ✅ 20 Task Ads Seeded.`);

    console.log("\n✅ SEED COMPLETE — Plans + Tasks ready.\n");
    process.exit(0);
};

seedPlans();
