require('dotenv').config({ path: 'd:/man2man/.env' }); // Adjust path if needed
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel'); // Ensure this path is correct
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1";

async function wipeAndVerify() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Wipe Users (except maybe admin, but for now wipe all to be clean)
        console.log('Wiping Users...');
        await User.deleteMany({});

        // 2. Wipe User Plans
        console.log('Wiping User Plans...');
        await UserPlan.deleteMany({});

        // 3. Create Super Admin
        console.log('Creating Super Admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            fullName: 'Super Admin',
            username: 'admin',
            primary_phone: '01700000000',
            password: hashedPassword,
            role: 'super_admin',
            country: 'Bangladesh',
            wallet: { main_balance: 1000000 }
        });

        // 4. Ensure Plans Exist (Optional but good for test)
        // Check if plans exist, if not create one
        const plans = await Plan.find({});
        if (plans.length === 0) {
            console.log('Creating Default Plan...');
            await Plan.create({
                name: 'Vip 1',
                unlock_price: 1500,
                daily_limit: 5,
                task_reward: 20,
                validity_days: 365,
                is_active: true
            });
        }

        console.log('DB Wipe and Setup Complete.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

wipeAndVerify();
