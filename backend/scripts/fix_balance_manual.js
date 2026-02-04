const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function fixBalance() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        // Supports both 01755555555 and +8801755555555 just in case
        const phone = '01755555555';
        const phoneWithCountry = '+8801755555555';

        let user = await User.findOne({ $or: [{ primary_phone: phone }, { primary_phone: phoneWithCountry }] });

        if (!user) {
            console.log("User not found via simple query. Trying regex...");
            user = await User.findOne({ primary_phone: /55555/ });
        }

        if (user) {
            console.log(`User Found: ${user.username} | ${user.primary_phone}`);
            console.log(`Current Balance: ${user.wallet.main_balance}`);

            // MANUAL UPDATE
            user.wallet.main_balance = 10000;
            user.markModified('wallet'); // Ensure it saves
            await user.save();

            console.log(`UPDATED Balance: ${user.wallet.main_balance}`);

            // Validation output for user
            console.log(JSON.stringify(user.toObject(), null, 2));
        } else {
            console.log("User '01755555555' NOT FOUND.");
        }

    } catch (e) { console.error(e); }
    finally { mongoose.disconnect(); }
}
fixBalance();
