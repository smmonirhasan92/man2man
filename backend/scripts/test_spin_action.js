const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SuperAceServiceV2 = require('../modules/game/SuperAceServiceV2');
const User = require('../modules/user/UserModel');
const TransactionHelper = require('../modules/common/TransactionHelper');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use the one we injected funds into
const MONGO_URI = 'mongodb://127.0.0.1:27018/universal_game_core_v1';

async function testSpin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const user = await User.findOne({ 'wallet.game': { $gt: 50 } });
        if (!user) {
            console.log("Still no user with balance! Injection failed?");
            process.exit(1);
        }

        console.log(`Spinning for User: ${user.username} (${user._id}) | Balance: ${user.wallet.game}`);

        try {
            const result = await SuperAceServiceV2.spin(user._id, 10);
            console.log("\n--- SPIN SUCCESS ---");
            console.log("Win:", result.win);
            console.log("New Balance:", result.balance);
        } catch (spinError) {
            console.log("\n--- SPIN FAILED ---");
            console.error(spinError.message);
        }

    } catch (e) {
        console.error("Test Error:", e.message);
    } finally {
        await mongoose.disconnect();
    }
}

testSpin();
