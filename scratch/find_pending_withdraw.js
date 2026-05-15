const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function findPendingWithdrawal() {
    try {
        await mongoose.connect(MONGO_URI);
        const Transaction = mongoose.connection.collection('transactions');
        const User = mongoose.connection.collection('users');

        const pendingWithdrawals = await Transaction.find({
            type: 'cash_out',
            status: 'pending'
        }).toArray();

        if (pendingWithdrawals.length === 0) {
            console.log('No pending withdrawals found.');
        } else {
            for (const wd of pendingWithdrawals) {
                const user = await User.findOne({ _id: wd.userId });
                console.log('--- PENDING WITHDRAWAL ---');
                console.log(`Transaction ID: ${wd._id}`);
                console.log(`User ID: ${wd.userId}`);
                console.log(`Username: ${user ? user.username : 'Unknown'}`);
                console.log(`Phone: ${user ? user.primary_phone : 'Unknown'}`);
                console.log(`Amount (NXS): ${Math.abs(wd.amount)}`);
                console.log(`Date: ${wd.createdAt}`);
                console.log(`Recipient Details: ${wd.recipientDetails || 'None'}`);
                console.log(`Description: ${wd.description}`);
                console.log('--------------------------');
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

findPendingWithdrawal();
