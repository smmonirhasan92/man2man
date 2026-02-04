const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');
require('dotenv').config({ path: './backend/.env' });

async function checkTest55() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Connected to DB");

        const user = await User.findOne({ username: 'test55' });
        if (!user) {
            console.log("User 'test55' not found.");
            return;
        }

        console.log("User 'test55' Found:", user._id);
        console.log("Wallets:", JSON.stringify(user.wallet, null, 2));
        console.log("Legacy Fields: Income:", user.income_balance, "Purchase:", user.purchase_balance, "Main:", user.main_balance, "Game:", user.game_balance);

        const txns = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100);
        console.log(`Found ${txns.length} transactions.`);

        txns.forEach(t => {
            console.log(`[${t.createdAt.toISOString()}] Type: ${t.type}, Amount: ${t.amount}, Status: ${t.status}, Desc: ${t.description}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkTest55();
