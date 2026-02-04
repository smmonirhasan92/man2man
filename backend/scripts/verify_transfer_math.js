const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../modules/user/UserModel');
const WalletService = require('../modules/wallet/WalletService');
const Transaction = require('../modules/wallet/TransactionModel');

// Configuration
const TEST_USER = 'vis_math_test';
const START_AMOUNT = 1000;
const TRANSFER_AMOUNT = 500;

async function verifyMath() {
    console.log("🧮 STARTING FINANCIAL MATH VERIFICATION");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create/Reset Test User
        await User.deleteOne({ username: TEST_USER });
        const user = await User.create({
            fullName: 'Math Tester',
            username: TEST_USER,
            phone: '01711112222',
            password: 'hash',
            country: 'BD',
            wallet: { main: START_AMOUNT, game: 0, income: 0 } // Start with 1000
        });
        console.log(`👤 User Created: Main=৳${user.main_balance}, Game=৳${user.game_balance}`);

        // 2. Perform Transfer (Main -> Game)
        console.log(`\n💸 Transferring ৳${TRANSFER_AMOUNT} to Quick Wallet (Game)...`);

        // Using the service directly to test logic
        const result = await WalletService.transferFunds(user._id, TRANSFER_AMOUNT, 'main', 'game', 'Math Test Transfer');

        // 3. Verify Balances
        const updatedUser = await User.findById(user._id);
        console.log(`\n✅ Transfer Complete.`);
        console.log(`   Start Main: ${START_AMOUNT}`);
        console.log(`   Transfer: -${TRANSFER_AMOUNT}`);
        console.log(`   Expected Main: ${START_AMOUNT - TRANSFER_AMOUNT}`);
        console.log(`   Actual Main:   ${updatedUser.wallet.main}`);

        console.log(`   Expected Game: ${TRANSFER_AMOUNT}`);
        console.log(`   Actual Game:   ${updatedUser.wallet.game}`);

        if (updatedUser.wallet.main !== (START_AMOUNT - TRANSFER_AMOUNT) || updatedUser.wallet.game !== TRANSFER_AMOUNT) {
            throw new Error("❌ MATH FAILURE: Balances do not match expectation.");
        }

        // 4. Verify Ledger (Transaction)
        const log = await Transaction.findOne({ userId: user._id, type: 'wallet_transfer' });
        if (!log) throw new Error("❌ LEDGER FAILURE: No transaction record found.");

        console.log(`\n📜 Ledger Entry Verified:`);
        console.log(`   Amount: ${log.amount}`);
        console.log(`   Type: ${log.type}`);

        console.log("\n✨ CONCLUSION: Financial Math is 100% Accurate.");
        process.exit(0);

    } catch (e) {
        console.error("❌ VERIFICATION FAILED:", e);
        process.exit(1);
    }
}

verifyMath();
