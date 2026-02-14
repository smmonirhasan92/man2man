const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const WalletService = require('./modules/wallet/WalletService');
const TransactionLedger = require('./modules/wallet/TransactionLedgerModel');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1";

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected");

        const RND = Math.floor(Math.random() * 1000000);
        const TEST_USERNAME = `VerifUser_${RND}`;

        console.log(`👤 Creating: ${TEST_USERNAME}`);

        const newUser = await User.create({
            username: TEST_USERNAME,
            fullName: 'Verif User',
            email: `verif_${RND}@example.com`,
            primary_phone: `017${RND}888`, // Uniqueish
            country: 'Bangladesh',
            password: 'pwd',
            role: 'user',
            wallet: { main: 1000, income: 1000 }
        });

        console.log("✅ Created User:", newUser._id);

        // Test 1: Transfer
        console.log("\n🧪 Test 1: Transfer Income -> Main");
        const res = await WalletService.transferFunds(newUser._id, 100, 'income', 'main', 'Test');
        console.log("Transfer Result:", res.success);

        const WithdrawalService = require('./modules/wallet/WithdrawalService');
        const TurnoverService = require('./modules/wallet/TurnoverService');

        // ... (In async function)

        // Test 2: Turnover Enforcement
        console.log("\n🧪 Test 2: Turnover Enforcement");

        // Add Requirement manually
        await TurnoverService.addRequirement(newUser._id, 500); // Need 500
        console.log("Added 500 Requirement");

        // Try Withdraw (Should be Flagged)
        try {
            const txn = await WithdrawalService.requestWithdrawal(newUser._id, 100, 'Bkash', '0170000', 'standard');
            if (txn.status === 'pending_admin_review') {
                console.log("✅ Withdrawal flagged as 'pending_admin_review' (Correct)");
            } else {
                console.error(`❌ Withdrawal Status Incorrect: ${txn.status}`);
            }
        } catch (e) {
            console.error("❌ Withdrawal Error:", e.message);
        }

        process.exit(0);

    } catch (e) {
        console.error("❌ Failed:", e);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
        process.exit(1);
    }
}

verify();
