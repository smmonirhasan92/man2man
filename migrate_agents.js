const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from the backend folder
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const connectDB = require('./backend/kernel/database');
const User = require('./backend/modules/user/UserModel');
const Transaction = require('./backend/modules/wallet/TransactionModel');

async function migrate() {
    try {
        await connectDB();
        console.log('--- AGENT ROLE MIGRATION START ---');

        // Logic: Find users who received 'admin_adjustment', 'mint', or 'admin_credit' 
        // with amount > 0 AND are currently role: 'user'
        const txs = await Transaction.find({ 
            type: { $in: ['admin_adjustment', 'mint', 'admin_credit'] }, 
            amount: { $gt: 0 } 
        }).distinct('userId');

        if (txs.length === 0) {
            console.log('No qualifying users found for migration.');
            process.exit(0);
        }

        const result = await User.updateMany(
            { 
                _id: { $in: txs },
                role: 'user' // Only upgrade normal users
            },
            { 
                $set: { 
                    role: 'agent',
                    'agentData.debtLimit': 5000 // Set a default limit
                } 
            }
        );

        console.log(`Migration Complete. Updated ${result.modifiedCount} users to Agent role.`);
        console.log('--- AGENT ROLE MIGRATION END ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
