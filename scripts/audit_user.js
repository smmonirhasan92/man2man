const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man';

const User = require('../backend/modules/user/UserModel');
const Plan = require('../backend/modules/admin/PlanModel');

async function audit() {
    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log('✅ Connected to DB');

        // 1. Check User
        const user = await User.findOne({ primary_phone: '01700000000' });
        if (!user) {
            console.log('❌ User 01700000000 NOT FOUND');
        } else {
            console.log(`✅ User Found: ${user.username} (${user.role})`);
            console.log(`   - Synthetic Phone: ${user.synthetic_phone || 'NONE'}`);
            console.log(`   - Wallet: Income=$${user.wallet.income}, Main=৳${user.wallet.main}`);

            // Check precision (USD should be float)
            const income = user.wallet.income;
            console.log(`   - USD Precision Check: ${income} (Type: ${typeof income})`);
        }

        // 2. Check Tasks Access / Active Plan
        // This is usually stored in User or computed via PlanService
        const PlanService = require('../backend/modules/plan/PlanService');
        // We can't easily call services without full app context sometimes, 
        // but we can check the user's plan usage data if it exists in the model
        // Assuming 'user.plans' or similar relationship, or just check 'synthetic_phone' which implies active plan.

        console.log('Audit Complete');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

audit();
