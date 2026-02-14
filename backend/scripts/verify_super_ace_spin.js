const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SuperAceService = require('../modules/game/SuperAceService');
const WalletService = require('../modules/wallet/WalletService');
const User = require('../user/UserModel');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifySpin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        // 1. Get a Test User
        const user = await User.findOne({ 'wallet.main': { $gte: 20 } });
        if (!user) {
            console.error("No suitable test user found with >20 BDT.");
            process.exit(1);
        }

        console.log(`Test User: ${user.username} (ID: ${user._id})`);
        console.log(`Initial Balance: ${user.wallet.main}`);

        // 2. Perform Spin (Bet 10)
        const betAmount = 10;
        console.log(`\n--- SPINNER STARTED (Bet: ${betAmount}) ---`);

        const result = await SuperAceService.spin(user._id, betAmount);

        console.log("Spin Result:", {
            win: result.win,
            isWin: result.win > 0,
            wallet_balance: result.wallet_balance
        });

        // 3. Verify Balance
        const updatedUser = await User.findById(user._id);
        const expectedBalance = user.wallet.main - betAmount + result.win;

        console.log(`\nOld Balance: ${user.wallet.main}`);
        console.log(`Bet: ${betAmount}`);
        console.log(`Win: ${result.win}`);
        console.log(`Calculated Expected: ${expectedBalance.toFixed(6)}`);
        console.log(`Actual DB Balance:   ${updatedUser.wallet.main}`);

        // Precision Check
        const diff = Math.abs(updatedUser.wallet.main - expectedBalance);
        if (diff < 0.000001) {
            console.log("✅ Balance Verification PASSED (Precision ok)");
        } else {
            console.log("❌ Balance Verification FAILED");
            console.log(`Diff: ${diff}`);
        }

    } catch (e) {
        console.error("Verification Error:", e);
    } finally {
        await mongoose.connection.close();
    }
}

verifySpin();
