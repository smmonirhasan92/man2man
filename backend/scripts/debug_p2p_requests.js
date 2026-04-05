const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../modules/wallet/TransactionModel');

async function debugP2P() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_game_core_v1');
        console.log('--- Checking for P2P Manual Requests (universal_game_core_v1) ---');
        
        const manualRequests = await Transaction.find({
            recipientDetails: /BITUKWI_MANUAL/
        }).populate('userId', 'fullName phone');

        console.log(`Found ${manualRequests.length} manual requests.`);
        
        manualRequests.forEach(trx => {
            console.log(`[${trx.type.toUpperCase()}] User: ${trx.userId?.fullName} | Amt: ${trx.amount} | Status: ${trx.status} | ID: ${trx.transactionId}`);
        });

        const pendingAll = await Transaction.countDocuments({ status: 'pending' });
        console.log(`Total Pending Transactions: ${pendingAll}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugP2P();
