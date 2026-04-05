const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../modules/wallet/TransactionModel');
const User = require('../modules/user/UserModel');

async function simulate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_game_core_v1');
        
        const user = await User.findOne({ role: 'user' });
        if (!user) {
            console.log('No user found to simulate with.');
            process.exit(1);
        }

        const trx = await Transaction.create({
            userId: user._id,
            type: 'add_money',
            amount: 500,
            status: 'pending',
            transactionId: 'SIM-P2P-' + Date.now(),
            recipientDetails: 'BITUKWI_MANUAL: [User Phone: 01712345678] Wants to buy 500 NXS. TEST SIMULATION.'
        });

        console.log('--- Simulation Success ---');
        console.log(`Transaction Created: ${trx.transactionId}`);
        console.log(`User: ${user.fullName} (${user.phone})`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

simulate();
