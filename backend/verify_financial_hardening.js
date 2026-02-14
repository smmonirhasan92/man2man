const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');
const TransactionLedger = require('./modules/wallet/TransactionLedgerModel');
const WalletService = require('./modules/wallet/WalletService');
const WithdrawalService = require('./modules/wallet/WithdrawalService');
const TurnoverService = require('./modules/wallet/TurnoverService');
const Notification = require('./modules/notification/NotificationModel');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1";

async function verify() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 0. Setup Test User
        const RND = Math.floor(Math.random() * 1000000);
        const TEST_USERNAME = `TestHardening_${RND}`;
        const TEST_EMAIL = `test_hardening_${RND}@example.com`;
        const TEST_PHONE = `017${RND}000`; // Ensure 11 digits approx or just unique strings

        console.log(`👤 Creating Test User: ${TEST_USERNAME} / ${TEST_PHONE}`);

        // No cleanup needed due to randomization

        let newUser;
        try {
            newUser = await User.create({
                username: TEST_USERNAME,
                fullName: 'Test User',
                email: TEST_EMAIL,
                primary_phone: TEST_PHONE,
                country: 'Bangladesh',
                password: 'password123',
                wallet: { main: 1000, income: 1000 }, // Simplify: Use defaults for others
                role: 'user'
            });
        } catch (createErr) {
            console.error("❌ User Creation Failed:", createErr.message);
            // Log formatting
            if (createErr.errors) Object.keys(createErr.errors).forEach(k => console.error(`- ${k}: ${createErr.errors[k].message}`));
            process.exit(1);
        }

        const userId = newUser._id;
        console.log("✅ Created Test User:", userId);

        // ==============================================
        // 1. Verify Unified Ledger (Transfer Funds)
        // ==============================================
        console.log("\n🧪 Test 1: Unified Ledger (Transfer Income -> Main)");

        await WalletService.transferFunds(userId, 100, 'income', 'main', 'Test Transfer');

        const ledgerEntries = await TransactionLedger.find({ userId }).sort({ createdAt: -1 });
        const lastDebit = ledgerEntries.find(l => l.type === 'transfer_out');
        const lastCredit = ledgerEntries.find(l => l.type === 'transfer_in');

        if (lastDebit && lastCredit) {
            console.log("✅ Ledger Entries Found!");
            console.log(`   Debit: ${lastDebit.amount} (${lastDebit.transactionId})`);
            console.log(`   Credit: ${lastCredit.amount} (${lastCredit.transactionId})`);
        } else {
            console.error("❌ Ledger Entries Missing!");
            console.log(ledgerEntries);
        }

        // ==============================================
        // 2. Verify Turnover Enforcement (Withdrawal)
        // ==============================================
        console.log("\n🧪 Test 2: Turnover Enforcement");

        // Add Requirement manually
        await TurnoverService.addRequirement(userId, 500); // Need 500

        // Try Withdraw
        try {
            const txn = await WithdrawalService.requestWithdrawal(userId, 100, 'Bkash', '0170000', 'standard');
            if (txn.status === 'pending_admin_review') {
                console.log("✅ Withdrawal flagged as 'pending_admin_review' (Correct)");
            } else {
                console.error(`❌ Withdrawal Status Incorrect: ${txn.status}`);
            }
        } catch (e) {
            console.error("❌ Withdrawal Error:", e.message);
        }

        // ==============================================
        // 3. Verify Agent Stock Guard
        // ==============================================
        console.log("\n🧪 Test 3: Agent Stock Guard");

        const AGENT_EMAIL = 'test_agent_guard@example.com';
        const AGENT_PHONE = '01788888888';
        const AGENT_USERNAME = 'TestAgentGuard';

        await User.deleteMany({
            $or: [
                { email: AGENT_EMAIL },
                { primary_phone: AGENT_PHONE },
                { username: AGENT_USERNAME }
            ]
        });

        const agent = await User.create({
            username: AGENT_USERNAME,
            fullName: 'Test Agent',
            country: 'Bangladesh',
            primary_phone: AGENT_PHONE,
            email: AGENT_EMAIL,
            password: 'password123',
            role: 'agent',
            wallet: { main: 600 } // Low Stock soon
        });

        // Deduct 200 -> Becomes 400 (Trigger < 500)
        await WalletService.deductBalance(agent._id, 200, 'agent', 'Simulated Withdrawal');

        // Check Notification
        // Wait 1s for async
        await new Promise(r => setTimeout(r, 1000));

        // Check if admin got notification
        // Note: NotificationService.sendToRole sends to ALL super_admins.
        // We'll check if ANY notification was created recently with 'Low Agent Stock'
        const notif = await Notification.findOne({
            type: 'warning',
            message: { $regex: 'Low Agent Stock' }
        }).sort({ createdAt: -1 });

        if (notif) {
            console.log("✅ Admin Notification Triggered:", notif.message);
        } else {
            console.warn("⚠️ No Notification Found (Check if Super Admin exists in DB)");
        }

        console.log("\n✅ Verification Complete.");
        process.exit(0);

    } catch (err) {
        // [FIX] Full Error Logging
        console.error("CRITICAL TEST FAILURE:", err);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`Validation Error [${key}]: ${err.errors[key].message}`);
            });
        }
        process.exit(1);
    }
}

verify();
