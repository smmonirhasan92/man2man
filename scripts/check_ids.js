const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB. Checking first 5 users...');

        const users = await User.find({}).limit(5).select('username nxsAccountId');
        console.log('Sample Data:', JSON.stringify(users, null, 2));

        const pendingCount = await User.countDocuments({ nxsAccountId: 'NXS-PENDING' });
        const missingCount = await User.countDocuments({ nxsAccountId: { $exists: false } });
        const nullCount = await User.countDocuments({ nxsAccountId: null });

        console.log(`Stats: Pending: ${pendingCount}, Missing: ${missingCount}, Null: ${nullCount}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
