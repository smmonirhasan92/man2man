const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');

// Live VPS DB
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function migrate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- Connected to LIVE DB ---');

        const users = await User.find({});
        console.log('Users to update: ' + users.length);

        for (const user of users) {
            // Generate a Secure 8-Digit Pay ID (Always contains at least one random pair)
            let nxsAccountId;
            let isUnique = false;
            while (!isUnique) {
                let base = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 digits
                let idx = Math.floor(Math.random() * 7); // Random position to double
                nxsAccountId = base.slice(0, idx) + base[idx] + base.slice(idx); // 8 digits with a pair
                
                const existing = await User.findOne({ nxsAccountId });
                if (!existing) isUnique = true;
            }

            user.nxsAccountId = nxsAccountId;
            
            // Bypass validation if needed, just save the ID
            await User.updateOne({ _id: user._id }, { $set: { nxsAccountId: user.nxsAccountId } });
            console.log(`Updated ${user.username} -> ${user.nxsAccountId}`);
        }

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
