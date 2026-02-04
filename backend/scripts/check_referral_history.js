const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

async function checkHistory() {
    const mongoUri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';
    await mongoose.connect(mongoUri);

    const user = await User.findOne({ username: 'test55' });
    if (!user) {
        console.log("User test55 not found.");
        process.exit(0);
    }

    console.log(`Checking History for: ${user.username} (${user._id})`);
    console.log(`Current Wallet: Main=${user.wallet.main}, Income=${user.wallet.income}`);

    const logs = await Transaction.find({
        userId: user._id,
        type: 'referral_commission'
    }).sort({ createdAt: -1 }).limit(5);

    if (logs.length === 0) {
        console.log("No Referral Commissions found.");
    } else {
        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] Amount: ${log.amount} | Desc: ${log.description} | Status: ${log.status}`);
        });
    }

    process.exit(0);
}

checkHistory();
