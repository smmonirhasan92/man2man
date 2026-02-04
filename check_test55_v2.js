const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');
require('dotenv').config({ path: './backend/.env' });

async function checkTest55() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Connected to DB");

        console.log("Searching for user...");
        const user = await User.findOne({ username: 'test55' });
        console.log("Search complete.");

        if (!user) {
            console.log("User 'test55' not found.");
        } else {
            console.log("User 'test55' Found:", user._id);
            console.log("Wallets:", JSON.stringify(user.wallet, null, 2));
            console.log("Legacy Fields: Income:", user.income_balance, "Purchase:", user.purchase_balance, "Main:", user.main_balance, "Game:", user.game_balance);

            const txns = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20);
            console.log(`Found ${txns.length} transactions.`);

            txns.forEach(t => {
                console.log(`[${t.createdAt.toISOString()}] Type: ${t.type}, Amount: ${t.amount}, Status: ${t.status}`);
            });
        }

    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Done.");
        process.exit(0);
    }
}

checkTest55();
