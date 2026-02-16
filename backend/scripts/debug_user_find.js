const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../modules/user/UserModel');
const TEST_USER_ID = '679bc2013ebbe7f73a469735';

async function run() {
    try {
        console.log("Connecting...");
        await mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log("Connected.");

        console.log("Finding ANY user...");
        const user = await User.findOne({});
        if (user) {
            const fs = require('fs');
            fs.writeFileSync(path.resolve(__dirname, 'userid.txt'), user._id.toString());
            console.log("User ID saved to userid.txt");
        } else {
            console.log("NULL");
        }

        if (user) {
            console.log("Balance:", user.wallet.game);
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

run();
