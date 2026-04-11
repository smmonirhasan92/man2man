const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./modules/user/UserModel');
const Plan = require('./modules/admin/PlanModel');
const TaskAd = require('./modules/task/TaskAdModel');
require('dotenv').config();

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

const CURRENCY = require('./config/currency'); // [NEW] Use central config

const seedPlans = async () => {
    await connectDB();

    console.log("\n=== SEEDING ACCOUNT TIERS [SAFE MODE] ===");
    // [FIX] Removed deleteMany to protect user custom rates

    for (const tier of TIERS) {
        const nxsPrice = tier.price;
        const usdPrice = parseFloat((nxsPrice * CURRENCY.NXS_TO_USD).toFixed(2)); // DYNAMIC 1 CENT CALC
        const rewardNxs = tier.reward;
        const totalReturn = parseFloat((tier.tasks * rewardNxs * tier.validity).toFixed(2));

        try {
            await Plan.findOneAndUpdate(
                { node_code: tier.server_id }, // Match by code/id
                {
                    $setOnInsert: { // ONLY SET IF NEW
                        _id: tier.id,
                        name: tier.name,
                        type: 'server',
                        unlock_price: nxsPrice,
                        price_usd: usdPrice,
                        daily_limit: tier.tasks,
                        task_reward: rewardNxs,
                        reward_multiplier: 1,
                        validity_days: tier.validity,
                        server_id: tier.server_id,
                        is_active: true,
                        features: [
                            `${tier.tasks} Daily Tasks`,
                            `${rewardNxs} NXS/Task`,
                            `${tier.validity} Days Validity`,
                            `Max Earn: ${totalReturn} NXS`
                        ]
                    }
                },
                { upsert: true, new: true }
            );
            console.log(`  ℹ️ ${tier.name.padEnd(12)} | Processed: ${nxsPrice} NXS | USD: ${usdPrice}`);
        } catch (e) {
            console.error(`  ❌ ERROR processing ${tier.name}:`, e.message);
        }
    }

    console.log("\n=== SEEDING TASK ADS [EMPTY ONLY] ===");
    const existingTasks = await TaskAd.countDocuments();
    
    if (existingTasks === 0) {
        const techGiants = ['NVIDIA', 'Tesla', 'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Intel'];
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
        console.log(`  ✅ ${tasks.length} Initial Task Ads Seeded.`);
    } else {
        console.log(`  ℹ️ Tasks already exist (${existingTasks}). Skipping.`);
    }

    // --- [NEW] SEED SUPER ADMIN (01712345678 / 000000) ---
    console.log("\n=== SEEDING SUPER ADMIN ===");
    const adminPhone = '01712345678';
    const existingAdmin = await User.findOne({ primary_phone: adminPhone });
    
    if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('000000', salt);
        await User.create({
            fullName: 'Super Admin (Seed)',
            primary_phone: adminPhone,
            phone: adminPhone,
            username: 'SuperAdminSeed',
            password: passwordHash,
            role: 'super_admin',
            wallet: { main: 100, game: 0, income: 0, purchase: 0, agent: 0 },
            status: 'active'
        });
        console.log(`  ✅ Super Admin Created: ${adminPhone}`);
    } else {
        console.log(`  ℹ️ Super Admin already exists.`);
    }

    console.log("\n✅ SEED COMPLETE — Plans + Tasks + Admin ready.\n");
    process.exit(0);
};

seedPlans();
