const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const WalletService = require('../modules/wallet/WalletService');
const User = require('../user/UserModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyTransfer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // 1. Find User with Income Balance
        // We need a user who has some income to transfer to main.
        // If not found, we might need to credit them first (or find one with main and move to game, but Income->Main has the fee).
        // Let's test Main -> Game first as it's cleaner, then try to fake Income -> Main if needed.

        const user = await User.findOne({ 'wallet.main': { $gte: 100 } });
        if (!user) {
            console.log("No user with >100 main balance found. creating dummy or skipping.");
            return;
        }

        console.log(`Test User: ${user.username}`);
        console.log(`Initial Main: ${user.wallet.main}`);
        console.log(`Initial Game: ${user.wallet.game}`);

        const amount = 50;

        // 2. Perform Transfer: Main -> Game
        console.log(`\n--- TRANSFER: Main -> Game (${amount}) ---`);
        // Note: WalletService.transferFunds signature: (userId, amount, fromWallet, toWallet, description)

        try {
            const result = await WalletService.transferFunds(user._id, amount, 'main', 'game', 'Audit Test');

            console.log("Transfer Result:", result);

            // 3. Verify
            const updatedUser = await User.findById(user._id);
            console.log(`New Main: ${updatedUser.wallet.main} (Expected: ${user.wallet.main - amount})`);
            console.log(`New Game: ${updatedUser.wallet.game} (Expected: ${user.wallet.game + amount})`);

            if (updatedUser.wallet.main === user.wallet.main - amount && updatedUser.wallet.game === user.wallet.game + amount) {
                console.log("✅ Main->Game Transfer is 1:1 (No Fee)");
            } else {
                console.log("❌ Main->Game Transfer Mismatch!");
            }

        } catch (e) {
            console.error("Transfer Error:", e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

verifyTransfer();
