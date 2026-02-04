const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("Starting Manual Fix...");

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
        console.log("Scanning for users with >= 7700 balance...");
        // Find users with balance satisfying the condition
        const users = await User.find({ "wallet.main_balance": { $gte: 7700 } }).sort({ updatedAt: -1 });

        if (users.length === 0) {
            console.log("No users found with >= 7700 BDT.");
        }

        for (const user of users) {
            // Check if they already have a 7700 deposit record
            const exists = await Transaction.findOne({
                userId: user._id,
                amount: 7700,
                type: { $in: ['recharge', 'add_money'] }
            });

            if (!exists) {
                console.log(`Creating missing history for: ${user.username} (${user._id})`);
                await Transaction.create({
                    userId: user._id,
                    type: 'add_money',
                    amount: 7700,
                    status: 'completed',
                    description: 'Deposit Approved (Recovery)',
                    adminComment: 'Manual Fix Script'
                });
                console.log("✅ FIXED.");
            } else {
                console.log(`Skipping ${user.username} (Record exists).`);
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        console.log("Done.");
        await mongoose.disconnect();
        process.exit();
    }
};

fixHistory();
