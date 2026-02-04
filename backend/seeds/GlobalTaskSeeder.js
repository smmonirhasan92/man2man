const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.resolve(__dirname, '../.env') });

// URI Fallback
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            family: 4,
            directConnection: true
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ DB Error:', err.message);
        process.exit(1);
    }
};

const seedTasks = async () => {
    await connectDB();

    try {
        const TaskAd = require('../modules/task/TaskAdModel');
        const Plan = require('../modules/admin/PlanModel');

        // 1. Clear Existing Tasks
        await TaskAd.deleteMany({});
        console.log('🗑️ Cleared existing tasks.');

        // 2. Get All Plans
        const plans = await Plan.find({});
        if (plans.length === 0) {
            console.error('❌ No Plans found! Run GlobalServerNodes.js first.');
            process.exit(1);
        }
        const allPlanIds = plans.map(p => p._id);
        console.log(`ℹ️ Found ${plans.length} Plans. linking tasks to all.`);

        // 3. Define Tasks
        const tasks = [
            {
                title: "Premium Ad View",
                url: "https://google.com",
                duration: 10,
                priority: 10,
                type: 'ad_view',
                reward_amount: 5, // Default, overridden by Plan multiplier/reward usually
                valid_plans: allPlanIds,
                is_active: true
            },
            {
                title: "Sponsor Showcase",
                url: "https://apple.com",
                duration: 15,
                priority: 8,
                type: 'ad_view',
                reward_amount: 5,
                valid_plans: allPlanIds, // Available to everyone
                is_active: true
            },
            {
                title: "Tech Review Clip",
                url: "https://techcrunch.com",
                duration: 20,
                priority: 5,
                type: 'video',
                reward_amount: 10,
                valid_plans: allPlanIds,
                is_active: true
            }
        ];

        // 4. Insert
        await TaskAd.insertMany(tasks);
        console.log(`✅ Seeded ${tasks.length} Global Tasks.`);

    } catch (err) {
        console.error(err);
    }

    process.exit();
};

seedTasks();
