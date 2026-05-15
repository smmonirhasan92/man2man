const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function refundUser() {
    try {
        await mongoose.connect(MONGO_URI);
        const Transaction = mongoose.connection.collection('transactions');
        const User = mongoose.connection.collection('users');

        const user = await User.findOne({ primary_phone: { $in: ['01727265007', '+8801727265007'] } });
        if (!user) {
            console.log('User not found.');
            return;
        }

        // Find the expired transactions
        // From previous log: cash_out is -1600, fee is -56, both on Tue May 12 2026 03:26:07
        const trxs = await Transaction.find({
            userId: user._id,
            status: 'expired',
            type: { $in: ['cash_out', 'fee'] }
        }).toArray();

        let totalRefund = 0;
        const trxIds = [];

        for (const trx of trxs) {
            totalRefund += Math.abs(trx.amount);
            trxIds.push(trx._id);
        }

        if (totalRefund === 0) {
            console.log('No expired withdrawal transactions found to refund.');
            return;
        }

        console.log(`Refunding ${totalRefund} NXS to user ${user.username}`);

        // Update the user's main wallet
        await User.updateOne(
            { _id: user._id },
            { $inc: { 'wallet.main': totalRefund } }
        );

        // Update transactions to 'rejected' so they aren't processed again
        // Or 'refunded'
        await Transaction.updateMany(
            { _id: { $in: trxIds } },
            { $set: { status: 'rejected', adminComment: 'Refunded expired transaction automatically' } }
        );

        console.log(`Successfully refunded ${totalRefund} NXS. Transactions updated to 'rejected'.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

refundUser();
