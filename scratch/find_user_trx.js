const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function findUserTransactions() {
    try {
        await mongoose.connect(MONGO_URI);
        const Transaction = mongoose.connection.collection('transactions');
        const User = mongoose.connection.collection('users');

        // Find the user by phone number
        const user = await User.findOne({ primary_phone: { $in: ['01727265007', '+8801727265007'] } });
        
        if (!user) {
            console.log('User Nazmul Islam not found.');
            return;
        }

        console.log(`Found User: ${user.fullName} (${user.primary_phone}) - ID: ${user._id}`);
        console.log(`Wallet Balance: Main: ${user.wallet?.main}, Game: ${user.wallet?.game}, Income: ${user.wallet?.income}`);

        // Get last 10 transactions
        const transactions = await Transaction.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        console.log('\--- RECENT TRANSACTIONS ---');
        for (const trx of transactions) {
            console.log(`Type: ${trx.type} | Amount: ${trx.amount} | Status: ${trx.status} | Date: ${trx.createdAt}`);
            console.log(`Description: ${trx.description}`);
            if (trx.recipientDetails) console.log(`Recipient: ${trx.recipientDetails}`);
            console.log('--------------------------');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

findUserTransactions();
