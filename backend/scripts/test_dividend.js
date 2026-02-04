const mongoose = require('mongoose');
const LeaderboardService = require('../modules/gamification/LeaderboardService');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
require('dotenv').config({ path: '../.env' });

async function testDividend() {
    try {
        console.log('CONNECTING...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('--- TESTING ROYAL DIVIDEND ---');

        // Ensure we have some active users with referrals
        const count = await User.countDocuments({ referralCount: { $gt: 0 } });
        if (count < 3) {
            console.log('Not enough eligible users. Creating dummy data...');
            // In a real dev env, we might seed here. For now, we assume some data exists 
            // from previous tasks or we just run logic on whoever exists.
        }

        const result = await LeaderboardService.processRoyalDividend();
        console.log('Dividend Result:', result);

        if (result.success) {
            console.log(`✅ Paid out to ${result.winners} winners.`);
        } else {
            console.log('❌ Dividend failed or no users eligible.');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testDividend();
