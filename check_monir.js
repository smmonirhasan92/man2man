const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend/.env') });

const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');

async function checkMonir() {
    try {
        await mongoose.connect(process.env.DB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log("Connected to DB");

        const user = await User.findOne({ primary_phone: '+8801712121212' });
        if (!user) {
            console.log("User Monir not found by phone.");
            return;
        }

        console.log(`User Found: ${user.fullName} (${user._id})`);
        console.log(`Wallet Balance:`, user.wallet);

        const txs = await Transaction.find({ userId: user._id }).sort({ createdAt: 1 });
        console.log(`Found ${txs.length} transactions.`);

        txs.forEach(t => {
            console.log(`[${t.createdAt.toISOString()}] ${t.type} | Amount: ${t.amount} | Status: ${t.status} | Note: ${t.adminNote || 'N/A'}`);
        });

        // Summary of types
        const types = {};
        txs.forEach(t => {
            if (t.status === 'completed') {
                types[t.type] = (types[t.type] || 0) + t.amount;
            }
        });
        console.log("\nSummary of Completed Transactions by Type:");
        console.log(types);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkMonir();
