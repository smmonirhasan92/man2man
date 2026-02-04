require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');

const seedPlan = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/man2man');
        console.log("🔥 Connected to DB. Seeding Starter Node...");

        await Plan.findOneAndUpdate(
            { name: "Starter Node" },
            {
                name: "Starter Node",
                desc: "Basic verification node.",
                unlock_price: 10, // $10
                daily_ad_limit: 15, // 15 Tasks
                validity_days: 35,
                roi_percentage: 150, // 150% = $15 Total
                referral_commission_percentage: 10
            },
            { upsert: true, new: true }
        );

        console.log("✅ Starter Node Seeded.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedPlan();
