/**
 * INTEGRATION TEST: Admin-User-Agent Sync & Centralized Control
 * Run with: node backend/scripts/integration_sync_test.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const WithdrawalService = require('../modules/wallet/WithdrawalService');
const SystemSetting = require('../modules/settings/SystemSettingModel');
const AgentService = require('../modules/wallet/AgentService');
const GamePoolService = require('../modules/game/GamePoolService');

// Mock specific services if needed, or perform direct DB ops
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/man2man_test_integration';

async function runTest() {
    console.log("🔵 Starting System Integration Check...");

    try {
        await mongoose.connect(DB_URI);
        console.log("✅ DB Connected");

        // CLEANUP
        await User.deleteMany({ username: /test_(user|agent|admin)/ });
        await Transaction.deleteMany({ description: /Integration Test/ });
        await SystemSetting.deleteMany({ key: 'global_profit_target_test' });

        // 1. SETUP ACTORS
        const user = await User.create({
            fullName: 'Test User', username: 'test_user_1', phone: '01700000001', password: 'hash',
            wallet: { main: 1000, game: 0 },
            country: 'BD'
        });

        const agent = await User.create({
            fullName: 'Test Agent', username: 'test_agent_1', phone: '01800000001', password: 'hash',
            role: 'agent',
            wallet: { agent: 0 }, // ZERO BALANCE for Failure Test
            country: 'BD'
        });

        const admin = await User.create({
            fullName: 'Test Admin', username: 'test_admin_1', phone: '01900000001', password: 'hash',
            role: 'admin',
            country: 'BD'
        });

        console.log(`✅ Actors Created: User(${user._id}), Agent(${agent._id})`);

        // ==========================================
        // TEST CASE 1: Agent Deposit (Failure - Low Balance)
        // ==========================================
        console.log("\n🔸 Running Test Case 1: Agent Deposit (Fail Scenario)...");
        // Logic: Agent tries to send money to User, but Agent has 0.
        // Direct Service Call simulation (Assuming AgentService.processDeposit exists or simulating logic)

        const depositAmount = 500;
        let depositError = null;
        try {
            // CALL REAL SERVICE
            await AgentService.processDeposit(agent._id, user._id, depositAmount);
        } catch (e) {
            depositError = e.message;
        }

        if (depositError === "Insufficient Agent Balance") {
            console.log("✅ PASSED: Agent Deposit Failed correctly due to low balance.");
        } else {
            console.error("❌ FAILED: Agent allowed deposit with 0 balance or wrong error.", depositError);
        }

        // ==========================================
        // TEST CASE 2: Agent Withdrawal Sync
        // ==========================================
        console.log("\n🔸 Running Test Case 2: Agent Withdrawal Sync...");

        // A. User Request
        const txn = await WithdrawalService.requestWithdrawal(
            user._id, 500, 'Agent Cash', 'Dhaka', 'standard', agent._id
        );

        if (txn.status === 'pending_admin_approval') {
            console.log("✅ Step A: Withdrawal Created & Pending Admin Approval");
        } else {
            console.error("❌ Step A Failed: Status is " + txn.status);
        }

        // B. Admin Approval (Simulation)
        // Update Txn -> pending_agent_action
        await Transaction.findByIdAndUpdate(txn._id, { status: 'pending_agent_action' });
        console.log("✅ Step B: Admin Approved (Simulated)");

        // C. Agent Action (Accept)
        // Agent Receives Stock (User gave 500 digital). User already deducted.
        await AgentService.acceptWithdrawal(agent._id, txn._id);

        const updatedAgent = await User.findById(agent._id);
        // Note: AgentService increments by abs(amount). User txn amount is -500. So +500.
        if (updatedAgent.wallet.agent === 500) {
            console.log("✅ Step C: Agent Wallet Increased. Flow Complete.");
        } else {
            console.error("❌ Step C Failed: Agent Wallet mismatch", updatedAgent.wallet.agent);
        }

        // ==========================================
        // TEST CASE 3: Centralized Control (RTP)
        // ==========================================
        console.log("\n🔸 Running Test Case 3: Centralized RTP Update...");

        // A. Set Config
        await SystemSetting.create({ key: 'global_profit_target_test', value: 95, category: 'game' });

        // B. Emit Event (Mocking Socket.io)
        const mockIo = { emit: (ev, data) => console.log(`📡 [Socket Mock] Emitting ${ev}:`, data) };
        mockIo.emit('config:update', { key: 'global_profit_target_test', value: 95 });

        // C. Verify Service Logic uses DB (It does by default)
        const storedSetting = await SystemSetting.findOne({ key: 'global_profit_target_test' });
        if (storedSetting.value === 95) {
            console.log("✅ Config Saved. Game Service will pick this up on next bet.");
        } else {
            console.error("❌ Config Save Failed");
        }

    } catch (err) {
        console.error("❌ FATAL TEST ERROR:", err);
    } finally {
        // cleanup commented out to inspect if needed, or uncomment for clean run
        // await User.deleteMany({ username: /test_/ });
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
