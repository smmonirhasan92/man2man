const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log("Starting Retrofit Script...");
console.log("URI:", process.env.MONGO_URI ? "Found" : "Missing");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error("Connect Error:", err);
        process.exit(1);
    }
};

const fixHistory = async () => {
    await connectDB();

    try {
        // 1. Find the user with ~7700 balance
        const users = await User.find({ "wallet.main_balance": { $gte: 7700 } }).sort({ updatedAt: -1 }).limit(1);

        if (users.length === 0) {
            console.log("No matching users found.");
            return;
        }

        const targetUser = users[0];
        console.log(`Targeting User: ${targetUser.username} (${targetUser._id})`);

        // 2. Create missing record
        const newTx = await Transaction.create({
            userId: targetUser._id,
            type: 'add_money',
            amount: 7700,
            status: 'completed',
            description: 'Deposit Approved (Recovery)',
            adminComment: 'System Retrofit Fix'
        });
        console.log("SUCCESS: Created Transaction Record:", newTx._id);

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        console.log("Done.");
        await mongoose.disconnect();
        process.exit();
    }
};

fixHistory();
