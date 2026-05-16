const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');

// Using the exact production URI from .env.prod
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';

async function migrate() {
    try {
        console.log('Connecting to Production DB at 127.0.0.1...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully!');

        const users = await User.find({
            $or: [
                { nxsAccountId: { $exists: false } },
                { nxsAccountId: null },
                { nxsAccountId: '' },
                { nxsAccountId: 'NXS-PENDING' }
            ]
        });
        
        console.log(`Found ${users.length} users needing ID generation.`);

        for (const user of users) {
            const randomId = Math.floor(1000 + Math.random() * 8999);
            const suffix = Math.floor(10 + Math.random() * 89);
            user.nxsAccountId = `NXS-${randomId}-${suffix}`;
            
            await user.save();
            console.log(`Generated ID for ${user.username}: ${user.nxsAccountId}`);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
