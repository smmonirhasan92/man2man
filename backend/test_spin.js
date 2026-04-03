
require('dotenv').config({ path: '/var/www/man2man/backend/.env' });
const mongoose = require('mongoose');
const User = require('/var/www/man2man/backend/modules/user/UserModel');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const userId = "69b1257e37de0366f5e48916"; // Extracted from logs
        const user = await User.findById(userId);
        console.log("Raw user wallet from DB:", user ? JSON.stringify(user.wallet) : "NOT FOUND");
        
        const testQuery = await User.findOne({ _id: userId, 'wallet.main': { : 1 } });
        console.log("Query GTE 1 match:", testQuery ? "MATCHED" : "NO MATCH");
        
        // Let's manually deduct 1 NXS to see if it allows it
        const updated = await User.findOneAndUpdate(
            { _id: userId, 'wallet.main': { : 1 } },
            { : { 'wallet.main': -1 } },
            { new: true }
        );
        console.log("Updated Wallet:", updated ? JSON.stringify(updated.wallet) : "FAILED UPDATE");

    } catch (err) {
        console.error("Test Error:", err);
    }
    process.exit();
}
test();
    
