const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function blindRestore() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        // Find match
        let user = await User.findOne({ username: 'test55' });
        if (!user) {
            console.log("test55 not found. searching for ANY user...");
            user = await User.findOne({});
        }

        if (user) {
            console.log(`Found User: ${user.username} (${user._id})`);
            console.log("RESTORING...");

            const res = await User.updateOne(
                { _id: user._id },
                {
                    $set: {
                        "wallet.main": 7032,
                        "wallet.income": 0.09,
                        "main_balance": 7032 // Legacy sync
                    }
                }
            );
            console.log("Restore Result:", res);
        } else {
            console.log("NO USERS FOUND IN DB at all.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

blindRestore();
