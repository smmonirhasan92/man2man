const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const UserPlan = require('./backend/modules/plan/UserPlanModel');
const Plan = require('./backend/modules/admin/PlanModel');
require('dotenv').config({ path: './backend/.env' });

async function migrateTiers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        const highValuePlans = await Plan.find({ unlock_price: { $gte: 1500 } }).select('_id');
        const planIds = highValuePlans.map(p => p._id);

        const activeHighUsers = await UserPlan.distinct('userId', {
            planId: { $in: planIds },
            status: 'active'
        });

        const result = await User.updateMany(
            { 
                _id: { $in: activeHighUsers },
                'taskData.accountTier': 'Starter' 
            },
            { $set: { 'taskData.accountTier': 'Silver' } }
        );

        console.log(`SUCCESS: ${result.modifiedCount} users promoted to SILVER tier.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrateTiers();
