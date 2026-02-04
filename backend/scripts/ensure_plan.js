const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../modules/user/UserModel');
const UserPlan = require('../modules/plan/UserPlanModel'); // You might need to verify this path/file exists
const Plan = require('../modules/admin/PlanModel');

async function fix() {
    try {
        if (!process.env.MONGODB_URI) { // Check both
            if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
            await mongoose.connect(process.env.MONGO_URI);
        } else {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        console.log('DB Connected.');

        const phone = '01512345678'; // test55 equivalent from verify script
        const user = await User.findOne({ primary_phone: { $regex: '015' } }); // Fuzzy match or exact from script

        if (!user) {
            console.log('User not found. Run verify script first to register.');
            process.exit(0);
        }
        console.log(`Found User: ${user.primary_phone} (${user._id})`);

        // 1. Ensure Country US
        user.country = 'US';
        // 2. Ensure Active Status
        user.status = 'active';
        // 3. Ensure Synthetic Phone
        if (!user.synthetic_phone) user.synthetic_phone = '+1 (555) 000-0000';
        await user.save();
        console.log('User Updated (US, Active, Key).');

        // 4. Force Plan
        // Find existing clean plan or create dummy
        await UserPlan.deleteMany({ userId: user._id }); // Clear old

        // Get a real Plan ID from DB
        const realPlan = await Plan.findOne({ unlock_price: 1300 });
        if (!realPlan) throw new Error('Seed Plans First! 1300 plan not found.');

        await UserPlan.create({
            userId: user._id,
            planId: realPlan._id,
            planName: realPlan.name,
            dailyLimit: realPlan.daily_limit,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'active',
            serverIp: '127.0.0.1'
        });
        console.log('UserPlan Forced: Active.');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
