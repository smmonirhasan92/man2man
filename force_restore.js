const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function forceRestore() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Forcing Balance Restoration for test55...");

        // HARD SET based on evidence
        const res = await User.updateOne(
            { username: 'test55' },
            {
                $set: {
                    "wallet.main": 7032,     // Restoring known BDT balance
                    "wallet.income": 10.50,  // Preserving Income seen in screenshot
                    "main_balance": 7032     // Sync Legacy just in case
                }
            }
        );

        console.log("Update Result:", res);
        console.log("Restoration Applied.");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

forceRestore();
