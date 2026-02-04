const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
require('dotenv').config({ path: './backend/.env' });

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        const user = await User.findOne({ username: 'test55' });
        if (!user) {
            console.log("User not found");
            return;
        }

        console.log("=== TEST55 DIAGNOSTIC ===");
        console.log("ID:", user._id);
        console.log("Legacy main_balance:", user.main_balance);
        console.log("Legacy income_balance:", user.income_balance);
        console.log("Wallet Object:", JSON.stringify(user.wallet, null, 2));

        // Auto-Fix if detected
        if (user.main_balance > 0 && user.wallet.main === 0) {
            console.log("!!! DETECTED HIDDEN FUNDS !!!");
            console.log(`Restoring ${user.main_balance} to wallet.main...`);

            // Direct update to ensure atomic fix
            await User.updateOne(
                { _id: user._id },
                { $set: { "wallet.main": user.main_balance } }
            );
            console.log("Restoration Complete.");
        } else {
            console.log("No hidden legacy discrepancy found (or wallet.main already has funds).");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
