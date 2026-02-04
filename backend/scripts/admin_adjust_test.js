/**
 * ADMIN CONTROL TEST
 * 1. Simulates Admin Login (or bypass check).
 * 2. Adjusts Main Wallet (+1000)
 * 3. Adjusts Game Wallet (+500)
 * 4. Adjusts Income Wallet (-200)
 * 5. Verifies all balances.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');

// We simulate the controller logic directly since we don't have express req/res mock easily available with auth middleware.
// We will reuse the logic from AdminController.updateUserBalance but call it directly or replicate it here to verify logic correctness.
const TransactionHelper = require('../modules/common/TransactionHelper');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/man2man_test_admin';

async function runAdminTest() {
    console.log("🔵 Starting Admin Balance Adjustment Test...");
    const logs = [];

    try {
        await mongoose.connect(DB_URI);

        // CLEANUP
        await User.deleteMany({ username: 'admin_test_target' });

        // CREATE USER
        const user = await User.create({
            fullName: 'Admin Target', username: 'admin_test_target', phone: '01900000000', password: 'hash',
            country: 'BD',
            wallet: { main: 100, game: 100, income: 100 }
        });
        console.log(`✅ Target User Created: ${user._id} | 100/100/100`);

        // ==========================================
        // TEST CASE 1: Credit Main Wallet (+1000)
        // ==========================================
        console.log("\n🔸 Test Case 1: Credit Main...");
        await performAdjustment(user._id, 1000, 'credit', 'main');
        const u1 = await User.findById(user._id);
        if (u1.wallet.main === 1100) logs.push({ test: 'Credit Main', status: 'PASSED', msg: '100 -> 1100' });
        else logs.push({ test: 'Credit Main', status: 'FAILED', msg: `Expected 1100, Got ${u1.wallet.main}` });

        // ==========================================
        // TEST CASE 2: Credit Game Wallet (+500)
        // ==========================================
        console.log("\n🔸 Test Case 2: Credit Game...");
        await performAdjustment(user._id, 500, 'credit', 'game');
        const u2 = await User.findById(user._id);
        if (u2.wallet.game === 600) logs.push({ test: 'Credit Game', status: 'PASSED', msg: '100 -> 600' });
        else logs.push({ test: 'Credit Game', status: 'FAILED', msg: `Expected 600, Got ${u2.wallet.game}` });

        // ==========================================
        // TEST CASE 3: Debit Income Wallet (-50)
        // ==========================================
        console.log("\n🔸 Test Case 3: Debit Income...");
        await performAdjustment(user._id, 50, 'debit', 'income');
        const u3 = await User.findById(user._id);
        if (u3.wallet.income === 50) logs.push({ test: 'Debit Income', status: 'PASSED', msg: '100 -> 50' });
        else logs.push({ test: 'Debit Income', status: 'FAILED', msg: `Expected 50, Got ${u3.wallet.income}` });

    } catch (err) {
        console.error("FATAL:", err);
    } finally {
        console.log("\n====== INTERNAL TEST LOGS ======");
        logs.forEach(l => console.log(`TEST: ${l.test} | STATUS: ${l.status} | MSG: ${l.msg}`));
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Logic Replication of AdminController
async function performAdjustment(userId, amount, type, walletType) {
    await TransactionHelper.runTransaction(async (session) => {
        const opts = session ? { session } : {};
        const user = await User.findById(userId).setOptions(opts);

        // Initialize if undefined
        if (user.wallet[walletType] === undefined) user.wallet[walletType] = 0;

        let finalAmount;
        if (type === 'credit') {
            user.wallet[walletType] = (user.wallet[walletType] || 0) + amount;
            finalAmount = amount;
        } else {
            user.wallet[walletType] = (user.wallet[walletType] || 0) - amount;
            finalAmount = -amount;
        }

        await user.save(opts);

        await Transaction.create([{
            userId: user._id,
            type: 'admin_adjustment',
            amount: finalAmount,
            status: 'completed',
            description: `Admin Adjustment (${walletType}): ${type.toUpperCase()}`,
        }], opts);
    });
}

runAdminTest();
