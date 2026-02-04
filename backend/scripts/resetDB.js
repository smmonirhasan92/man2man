const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../kernel/database');

const resetDB = async () => {
    try {
        await connectDB();

        console.log('⚠️  WARNING: PERMANENT DATA DELETION STARTED ⚠️');

        // 1. Users
        await mongoose.connection.collection('users').deleteMany({});
        console.log('✅ Users Wiped');

        // 2. Transactions
        await mongoose.connection.collection('transactions').deleteMany({});
        console.log('✅ Transactions Wiped');

        // 3. Wallets (If separate collection, though usually embedded in user)
        // Checking if 'wallets' collection exists just in case
        const collections = await mongoose.connection.db.listCollections().toArray();
        const hasWallets = collections.some(c => c.name === 'wallets');
        if (hasWallets) {
            await mongoose.connection.collection('wallets').deleteMany({});
            console.log('✅ Wallets Wiped');
        }

        // 4. Tasks/Ads Activity (Optional - based on user request "reset system")
        // Keeping System Settings intact usually, unless requested.

        console.log('🎉 Database Reset Complete. System is Fresh.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

resetDB();
