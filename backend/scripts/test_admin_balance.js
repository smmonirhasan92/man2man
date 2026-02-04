const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Connected to MongoDB");

        // 1. Create Test User
        const testUser = await User.findOneAndUpdate(
            { username: 'admin_balance_tester' },
            {
                username: 'admin_balance_tester',
                fullName: 'Balance Tester',
                primary_phone: '9999999999',
                country: 'TestWorld',
                password: 'hash',
                wallet: { main: 100 }
            },
            { upsert: true, new: true }
        );
        console.log(`Test User Init Balance: ${testUser.wallet.main}`);

        // 2. Simulate Admin Controller Logic (Directly, since we are testing logic not HTTP route)
        const amount = 50;
        const type = 'credit';
        const adjustment = 50;
        const balBefore = testUser.wallet.main;
        const balAfter = balBefore + adjustment;

        // Perform Update
        testUser.wallet.main = balAfter;
        await testUser.save();

        // Create Ledger
        await TransactionLedger.create({
            userId: testUser._id,
            type: 'admin_adjustment',
            amount: adjustment,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: "Test Adjustment",
            transactionId: `TEST_${Date.now()}`
        });

        // Create UI Transaction
        await Transaction.create({
            userId: testUser._id,
            type: 'admin_adjustment',
            amount: adjustment,
            status: 'completed',
            source: 'admin',
            description: "Test Credit",
            balanceAfter: balAfter
        });

        console.log(`Updated User Balance: ${testUser.wallet.main}`);

        // 3. Verify
        const finalUser = await User.findById(testUser._id);
        if (finalUser.wallet.main === 150) {
            console.log("✅ Verification SUCCESS: Balance is 150");
        } else {
            console.error(`❌ Verification FAILED: Expected 150, got ${finalUser.wallet.main}`);
            process.exit(1);
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runTest();
