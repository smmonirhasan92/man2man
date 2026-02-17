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

        const username = process.argv[2];
        if (!username) {
            console.log("Usage: node debug_user_find.js <username>");
            process.exit(1);
        }

        console.log(`Finding user: ${username}...`);
        const user = await User.findOne({ username: username });

        if (user) {
            console.log(JSON.stringify(user, null, 2));
            console.log("\n--- WALLET ---");
            console.log(JSON.stringify(user.wallet, null, 2));
        } else {
            console.log("USER NOT FOUND");
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

run();
