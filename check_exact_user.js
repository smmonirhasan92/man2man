const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/universal_game_core_v1";

async function check() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to universal_game_core_v1');

        // Search for user by name "Test us" or similar
        const users = await mongoose.connection.db.collection('users').find({
            $or: [
                { fullName: { $regex: 'Test us', $options: 'i' } },
                { username: { $regex: 'Test us', $options: 'i' } }
            ]
        }).toArray();

        console.log(`Found ${users.length} users matching 'Test us':`);
        users.forEach(u => {
            console.log(`- ID: ${u._id}`);
            console.log(`  Name: ${u.fullName}`);
            console.log(`  Phone: ${u.primary_phone} / ${u.phone}`);
            console.log(`  Wallet:`, u.wallet);
            console.log('-------------------');
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
