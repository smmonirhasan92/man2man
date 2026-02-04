const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../modules/user/UserModel');

async function addTestFunds() {
    console.log("💰 ADDING TEST FUNDS...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({});
        console.log(`   Found ${users.length} users.`);

        for (const user of users) {
            if (!user.wallet) user.wallet = {};
            // Set a generous amount for testing
            user.main_balance = 50000;
            user.game_balance = 50000; // Add to Game Wallet for Teen Patti
            await user.save({ validateBeforeSave: false });
            console.log(`   + Added 50000 to user ${user.username || user._id}`);
        }

        console.log(`✅ Funds added successfully.`);
        process.exit(0);
    } catch (e) {
        console.error("❌ ERROR:", e);
        process.exit(1);
    }
}

addTestFunds();
