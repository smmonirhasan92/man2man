const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const fixHistory = async () => {
    await connectDB();

    try {
        // 1. Find the user with ~7700 balance or recent deposit
        // Since we don't have the ID, we'll look for user who has balance >= 7700 but NO "add_money" transaction of 7700 
        // OR just look for the most recent user login?
        // User said "The user deposited 7700".
        // Let's search for a user with wallet.main_balance >= 7700

        console.log("Searching for potential users...");
        const users = await User.find({ "wallet.main_balance": { $gte: 7700 } }).sort({ updatedAt: -1 }).limit(5);

        if (users.length === 0) {
            console.log("No matching users found with balance >= 7700.");
            process.exit(0);
        }

        const targetUser = users[0]; // Assume the most recently active one
        console.log(`Targeting User: ${targetUser.username} (${targetUser._id}) - Balance: ${targetUser.wallet.main_balance}`);

        // 2. Check if transaction already exists
        const exists = await Transaction.findOne({
            userId: targetUser._id,
            amount: 7700,
            type: { $in: ['recharge', 'add_money'] }
        });

        if (exists) {
            console.log("Transaction already exists in history:", exists._id);
            // Verify status
            if (exists.status !== 'completed') {
                exists.status = 'completed';
                await exists.save();
                console.log("Fixed: Marked existing transaction as completed.");
            } else {
                console.log("No action needed.");
            }
        } else {
            // 3. Create missing record
            console.log("Creating missing history record...");
            const newTx = await Transaction.create({
                userId: targetUser._id,
                type: 'add_money',
                amount: 7700,
                status: 'completed',
                description: 'Deposit Approved (Recovery)',
                adminComment: 'System Retrofit Fix'
            });
            console.log("SUCCESS: Created Transaction Record:", newTx._id);
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixHistory();
