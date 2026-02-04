const mongoose = require('mongoose');
const ReferralService = require('../modules/referral/ReferralService');
const User = require('../modules/user/UserModel');
const Transaction = require('../wallet/TransactionModel');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

async function testEmpire() {
    try {
        console.log('CONNECTING...');
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Find a user with referrals
        // Or create a dummy chain if needed
        const user = await User.findOne({ referralCount: { $gt: 0 } });

        if (!user) {
            console.log('No user with referrals found. Creating dummy chain...');
            // Create dummy logic here if needed, or just exit
            return;
        }

        console.log(`TESTING FOR USER: ${user.username} (${user._id})`);

        const stats = await ReferralService.getNetworkEmpireStats(user._id);
        console.log('--- EMPIRE STATS ---');
        console.table(stats);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testEmpire();
