const mongoose = require('mongoose');

// DBs to probe
const URIS = [
    'mongodb://127.0.0.1:27018/universal_game_core_v1',
    'mongodb://127.0.0.1:27018/usa-affiliate',
    'mongodb://127.0.0.1:27018/walet-game',
    'mongodb://127.0.0.1:27017/universal_game_core_v1',
    'mongodb://127.0.0.1:27017/usa-affiliate'
];

// Defined Schema to avoid "collection not found" if using clean Mongoose
const UserSchema = new mongoose.Schema({
    username: String,
    wallet: {
        game: { type: Number, default: 0 }
    }
}, { strict: false });

async function scan() {
    for (const uri of URIS) {
        console.log(`\n--- Probing ${uri} ---`);
        try {
            if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });

            const User = mongoose.model('User', UserSchema);

            const count = await User.countDocuments();
            if (count > 0) {
                console.log(`Found ${count} users.`);
                const allUsers = await User.find({});

                // Print Stats
                allUsers.forEach(u => console.log(`[${uri}] ${u.username}: Main=${u.wallet.main}, Game=${u.wallet.game}`));

                // INJECT FUNDS
                // Only inject funds for the specified URI
                if (uri === 'mongodb://127.0.0.1:27018/universal_game_core_v1') {
                    const targetUser = allUsers[0];
                    if (targetUser) {
                        console.log(`Injecting 1000 Game Balance to ${targetUser.username}...`);
                        // Use updateOne to bypass schema strictness if needed, but save() is better if schema matches
                        // We use model update
                        await User.updateOne({ _id: targetUser._id }, { $set: { 'wallet.game': 1000 } });
                        console.log("Injection Complete.");
                    }
                }
            } else {
                console.log(`Database empty.`);
            }

            // Clean up model to allow re-definition in next loop if needed (though we reuse schema)
            delete mongoose.connection.models['User'];

        } catch (e) {
            console.log(`Connection Failed: ${e.message}`);
        }
    }
    process.exit(0);
}

scan();
