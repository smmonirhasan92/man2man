const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find user by partial name or initials if KM is known, or just search for anyone with referral stats
        const users = await User.find({ fullName: /KM/i }).select('username fullName referralEarningsByLevel referralIncome wallet');

        if (users.length === 0) {
            console.log('User KM not found, checking recent referral commissions instead');
            const recentComms = await Transaction.find({ type: 'referral_commission' }).sort({ createdAt: -1 }).limit(5);
            console.log('Recent Commissions:', JSON.stringify(recentComms, null, 2));

            if (recentComms.length > 0) {
                const targetUserId = recentComms[0].userId;
                const user = await User.findById(targetUserId).select('username fullName referralEarningsByLevel referralIncome');
                console.log('Data for User who received commission:', JSON.stringify(user, null, 2));
            }
        } else {
            console.log('Found Users:', JSON.stringify(users, null, 2));
            for (const user of users) {
                const comms = await Transaction.find({ userId: user._id, type: 'referral_commission' }).sort({ createdAt: -1 }).limit(5);
                console.log(`Recent Commissions for ${user.username}:`, JSON.stringify(comms, null, 2));
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

debugUser();
