const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Plan = require('../modules/admin/PlanModel');
const AccountTier = require('../modules/settings/AccountTierModel');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');

// Env Logic
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '.env') });
let uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) { process.exit(1); }
if (!uri.includes('directConnection=true')) {
    uri += (uri.includes('?') ? '&' : '?') + 'directConnection=true';
}

const USD_RATE = 120.65;
const WORKING_DAYS = 26;

const calculateEconomics = (investment, profitPercent, tasks) => {
    const totalReturn = investment * (1 + (profitPercent / 100)); // USD
    const dailyIncome = totalReturn / WORKING_DAYS; // USD
    const taskReward = dailyIncome / tasks; // USD
    return { dailyIncome, taskReward, totalReturn };
};

const plansData = [
    { name: "USA Nano Node", price: 10.50, tasks: 20, profit: 70, flag: "🇺🇸" },
    { name: "USA Micro Node", price: 15.25, tasks: 20, profit: 70, flag: "🇺🇸" },
    { name: "Canada Lite", price: 22.80, tasks: 20, profit: 70, flag: "🇨🇦" },
    { name: "Canada Pro-VXC", price: 35.45, tasks: 15, profit: 75, flag: "🇨🇦" },
    { name: "Ireland Dublin", price: 52.15, tasks: 15, profit: 80, flag: "🇮🇪" },
    { name: "Ireland Prime", price: 78.60, tasks: 15, profit: 80, flag: "🇮🇪" },
    { name: "Global Elite", price: 105.35, tasks: 12, profit: 85, flag: "🌐" },
    { name: "USA Dedicated", price: 145.90, tasks: 9, profit: 90, flag: "🇺🇸" },
    { name: "Master Infra", price: 180.25, tasks: 8, profit: 95, flag: "👑" },
    { name: "Sovereign Elite", price: 207.15, tasks: 8, profit: 95, flag: "👑" }
];

const seedPlans = async () => {
    try {
        console.log(`🔌 Connecting to DB (Dual Sync)...`);
        await mongoose.connect(uri, { family: 4 });

        // 1. DATABASE PURGE
        console.log('🔥 PURGING DATABASE (Emergency Reset)...');
        await User.deleteMany({});
        await Transaction.deleteMany({});
        await Plan.deleteMany({});
        await AccountTier.deleteMany({});

        try {
            const UserPlan = require('../modules/plan/UserPlanModel');
            await UserPlan.deleteMany({});
        } catch (e) { }

        console.log('✅ Partial Wipe Complete.');

        // 2. SEED USERS
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('000000', salt);

        // Super Admin
        await User.create({
            fullName: 'Super Admin',
            username: 'superadmin',
            primary_phone: '00000000000',
            password: hashedPassword,
            role: 'super_admin',
            country: 'USA',
            status: 'active',
            wallet: { main: 1000000, income: 10000 },
            referralCode: 'ADMIN'
        });

        // Regular User
        await User.create({
            fullName: 'Test User',
            username: 'user01',
            primary_phone: '01700000000',
            password: hashedPassword,
            role: 'user',
            country: 'BD',
            status: 'active',
            wallet: { main: 50000, income: 0, game: 0, purchase: 0 }, // 50k BDT Opening Balance
            referralCode: 'USER01',
            isDeviceWhitelisted: true
        });

        console.log('✅ Accounts Provisioned: Admin & User (01700000000 / 000000)');

        // 3. SEED PLANS (USD LOGIC)
        for (const data of plansData) {
            const econ = calculateEconomics(data.price, data.profit, data.tasks);
            const bdtPrice = data.price * USD_RATE;

            const plan = {
                name: data.name,
                unlock_price: Math.ceil(bdtPrice), // BDT (Purchase)
                price_usd: data.price,             // USD (Base)
                task_reward: Number(econ.taskReward.toFixed(4)), // USD/Task (4 decimals for precision)
                daily_limit: data.tasks,
                validity_days: 30,
                is_active: true,
                features: [
                    `${data.flag} Features: ${data.profit}% Profit Share`,
                    `Total Return: $${econ.totalReturn.toFixed(2)}`,
                    `Daily Income: $${econ.dailyIncome.toFixed(2)}`,
                    "30 Days Cycle"
                ]
            };

            await Plan.create(plan);
            await AccountTier.create(plan);

            console.log(`✅ Synced: ${plan.name} (USD $${data.price} | BDT ৳${plan.unlock_price}) -> Reward: $${plan.task_reward}`);
        }

        console.log('🎉 SYSTEM RESET COMPLETE & HYBRID WALLET READY!');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

seedPlans();
