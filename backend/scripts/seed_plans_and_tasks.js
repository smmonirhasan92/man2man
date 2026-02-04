const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

const PLANS = [
    {
        name: 'Starter Plan',
        price: 0,
        unlock_price: 0,
        daily_limit: 5,
        task_reward: 2.0,
        validity_days: 365,
        features: ['5 Daily Tasks', 'Basic Earnings', 'No Support'],
        description: 'For beginners to taste the platform.',
        is_active: true
    },
    {
        name: 'Standard Plan',
        price: 1300,
        unlock_price: 1300,
        daily_limit: 10,
        task_reward: 5.0,
        validity_days: 365,
        features: ['10 Daily Tasks', 'Standard Earnings', 'Email Support', 'Withdrawal Priority'],
        description: 'Best value for regular earners.',
        is_active: true,
        recommended: true
    },
    {
        name: 'Premium Plan',
        price: 5000,
        unlock_price: 5000,
        daily_limit: 20,
        task_reward: 12.0,
        validity_days: 365,
        features: ['20 Daily Tasks', 'High Earnings', '24/7 VIP Support', 'Instant Withdrawal'],
        description: 'Maximize your income potential.',
        is_active: true
    }
];

const VIDEO_IDS = [
    'dQw4w9WgXcQ', 'L_jWHffIx5E', 'kJQP7kiw5Fk', '9bZkp7q19f0', 'jNQXAC9IVRw',
    'fJ9rUzIMcZQ', 'OPf0YbXqDm0', 'RgKAFK5djSk', 'KMj6P62K7Fk', 'ASO_zypdnsQ'
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Clear Data
        await Plan.deleteMany({});
        await TaskAd.deleteMany({});
        console.log('Cleared existing Plans and Tasks.');

        // 2. Insert Plans
        const plans = await Plan.insertMany(PLANS);
        console.log(`Included ${plans.length} Plans:`);
        plans.forEach(p => console.log(` - ${p.name}: ৳${p.unlock_price}, Limit ${p.daily_limit}, Reward ৳${p.task_reward}`));

        // 3. Insert Tasks
        const tasks = [];
        for (let i = 1; i <= 20; i++) {
            const vidId = VIDEO_IDS[i % VIDEO_IDS.length];
            tasks.push({
                title: `Watch Sponsor Video #${i}`,
                description: `Complete this verify to earn rewards.`,
                url: `https://www.youtube.com/watch?v=${vidId}`,
                reward_amount: 0, // Controlled by Plan now
                duration: 6, // 6 seconds
                total_budget: 100000,
                remaining_budget: 100000,
                is_active: true,
                created_by: plans[0]._id // Dummy ID
            });
        }

        await TaskAd.insertMany(tasks);
        console.log(`Inserted ${tasks.length} active tasks.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
