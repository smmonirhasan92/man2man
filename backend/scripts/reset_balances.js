const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

async function resetBalances() {
    console.log("🧹 STARTING BALANCE RESET - CLEAN SLATE PROTOCOL");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("1. Finding Users...");
        const users = await User.find({});
        console.log(`   Found ${users.length} users.`);

        // Force Manual Update to avoid Schema Strictness weirdness on updateMany
        for (const user of users) {
            if (!user.wallet) user.wallet = {};
            user.main_balance = 0;
            user.game_balance = 0;
            user.income_balance = 0;
            user.purchase_balance = 0;
            await user.save({ validateBeforeSave: false });
        }

        console.log(`✅ Zeroed out wallets for all users.`);

        await Transaction.deleteMany({});
        console.log(`✅ Cleared Transaction History.`);

        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
}

resetBalances();
