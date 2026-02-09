
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const SuperAceService = require('../modules/game/SuperAceService');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function verifyDeduction() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find a test user or create one
        let user = await User.findOne({ 'wallet.main': { $gt: 100 } });
        if (!user) {
            console.log("No distinct user found with >100 balance, using first user.");
            user = await User.findOne({});
            if (!user) {
                console.error("No users found at all.");
                process.exit(1);
            }
            // Inject funds if needed
            if ((user.wallet.main || 0) < 50) {
                user.wallet.main = (user.wallet.main || 0) + 500;
                await user.save();
                console.log(`Injected 500 into user ${user._id}`);
            }
        }

        const initialBalance = user.wallet.main;
        const betAmount = 10;

        console.log(`--- START VERIFICATION ---`);
        console.log(`User ID: ${user._id}`);
        console.log(`Initial Main Balance: ${initialBalance}`);
        console.log(`Bet Amount: ${betAmount}`);

        // Run Spin
        const result = await SuperAceService.spin(user._id, betAmount);

        // Fetch User again to confirm persistence
        const updatedUser = await User.findById(user._id);
        const finalBalance = updatedUser.wallet.main;

        console.log(`Spin Result Win: ${result.win}`);
        console.log(`Final Main Balance: ${finalBalance}`);

        const expectedBalanceWithoutWin = initialBalance - betAmount;
        const expectedBalance = expectedBalanceWithoutWin + result.win;

        // Float precision fix
        const diff = Math.abs(finalBalance - expectedBalance);

        if (diff < 0.01) {
            console.log(`[SUCCESS] Balance matched expectation (Initial ${initialBalance} - Bet ${betAmount} + Win ${result.win} = ${finalBalance})`);
        } else {
            console.log(`[FAILURE] Balance mismatch! Expected ${expectedBalance}, got ${finalBalance}`);
        }
        console.log(`--- END VERIFICATION ---`);

    } catch (err) {
        console.error("Verification Attempt Failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyDeduction();
