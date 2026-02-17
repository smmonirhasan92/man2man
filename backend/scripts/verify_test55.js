const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const PlanService = require('../modules/plan/PlanService');
const connectDB = require('../kernel/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function verifyTest55() {
    try {
        console.log("🚀 Connecting to MongoDB...");
        await connectDB();

        const username = "test55";
        const user = await User.findOne({ username });

        if (!user) {
            console.log(`❌ User '${username}' NOT FOUND.`);
        } else {
            console.log(`✅ User '${username}' FOUND.`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Wallet:`, user.wallet);
            console.log(`   TaskData:`, user.taskData);

            const limit = await PlanService.getUserDailyLimit(user._id);
            console.log(`   Daily Limit (PlanService): ${limit}`);

            const activePlans = await PlanService.getActivePlans(user._id);
            console.log(`   Active Plans Count: ${activePlans.length}`);
            activePlans.forEach(p => console.log(`     - ${p.planName} (Expires: ${p.expiryDate})`));
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

verifyTest55();
