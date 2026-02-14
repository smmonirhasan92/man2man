
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const GameLog = require('../modules/game/GameLogModel'); // Assuming this exists, or we check transactions
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function verifyLiveSpin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Search for user with balance 2168
        const user = await User.findOne({ 'wallet.main': 2168 });

        if (user) {
            console.log(`FOUND USER: ${user._id} | Balance: ${user.wallet.main}`);

            // Check for recent update
            // We can't easily check 'last spin' without a log model if SuperAceService doesn't save one.
            // But we can check updated_at if it's recent.
            console.log(`Last User Update: ${user.updatedAt}`);

            // Or just success message
            console.log("User exists with exact balance from screenshot.");
        } else {
            console.log("No user found with exact balance 2168. Checking range...");
            const users = await User.find({ 'wallet.main': { $gte: 2158, $lte: 2178 } });
            if (users.length > 0) {
                users.forEach(u => console.log(`Potential Match: ${u._id} | Bal: ${u.wallet.main}`));
            } else {
                console.log("No matching users found.");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLiveSpin();
