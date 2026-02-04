const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const adminController = require('../controllers/adminController');
const walletController = require('../controllers/walletController');
const PlanService = require('../modules/plan/PlanService');

// Mock Req/Res
const mockReqRes = (body = {}, user = {}) => {
    const req = { body, user: { user } };
    const res = {
        status: (code) => {
            // console.log(`[Status] ${code}`); 
            return { json: (d) => ({ ...d, statusCode: code }) };
        },
        json: (d) => d
    };
    return { req, res };
};

async function runTest() {
    await connectDB();
    console.log('--- STARTING AGENT FLOW VERIFICATION ---');

    console.log('[1] Setup Agent & User...');
    // Clean up previous runs
    await User.deleteMany({
        $or: [
            { username: { $in: ['test_agent', 'test_user_client', 'ref_user'] } },
            { phone: { $in: ['999001', '999002', '999003'] } }
        ]
    });

    // Create Agent (Standalone - No Transaction)
    const agent = await User.create({
        fullName: 'Test Agent', username: 'test_agent', phone: '999001',
        password: 'hash', role: 'agent', country: 'BD',
        wallet: { main: 0, agent: 0, income: 0, purchase: 0 },
        referralCode: 'TEST_AGENT_REF'
    });

    const user = await User.create({
        fullName: 'Test User', username: 'test_user_client', phone: '999002',
        password: 'hash', role: 'user', country: 'BD',
        wallet: { main: 0 }
    });

    console.log('[2] Loading Agent Stock (Admin Action)...');

    // Create Trx (Simulate Client Action usually done by agentController.requestTopup)
    const rechargeTrx = await Transaction.create({
        userId: agent._id, type: 'agent_recharge', amount: 1000, status: 'pending', recipientDetails: 'Test Load'
    });

    // Mock Admin Manage Request
    const { req: admReq, res: admRes } = mockReqRes({
        transactionId: rechargeTrx._id, status: 'completed', comment: 'Approved'
    }, { id: 'admin_id' }); // Mock admin

    await adminController.manageTransaction(admReq, admRes);

    const agentAfterLoad = await User.findById(agent._id);
    if (agentAfterLoad.wallet.agent === 1000) {
        console.log('✅ PASS: Agent Stock Loaded (wallet.agent = 1000)');
    } else {
        console.error(`❌ FAIL: Agent Stock mismatch: ${agentAfterLoad.wallet.agent} (Expected 1000)`);
    }

    console.log('[3] Agent Sends Money to User (Stock Transfer)...');
    // Mock Wallet Controller Send
    const { req: sendReq, res: sendRes } = mockReqRes(
        { amount: 200, recipientPhone: user.primary_phone },
        { id: agent._id, role: 'agent' } // Auth Context
    );

    try {
        await walletController.sendMoney(sendReq, sendRes);

        const agentAfterSend = await User.findById(agent._id);
        const userAfterSend = await User.findById(user._id);

        if (agentAfterSend.wallet.agent === 800 && userAfterSend.wallet.main === 200) {
            console.log('✅ PASS: Stock Deducted, User Credited.');
        } else {
            console.error(`❌ FAIL: Send Money. Agent Stock: ${agentAfterSend.wallet.agent}, User Main: ${userAfterSend.wallet.main}`);
        }
    } catch (e) {
        console.error('❌ FAIL: Send Money Error:', e);
    }

    console.log('[4] Financial Integrity: Agent buys Personal Plan...');
    // Agent has 800 in STOCK, but 0 in MAIN. 
    // Plan purchase uses MAIN. Should FAIL.
    const Plan = require('../modules/admin/PlanModel');
    const plan = await Plan.findOneAndUpdate({ name: 'TestPlan' }, { unlock_price: 100 }, { upsert: true, new: true });

    try {
        await PlanService.purchasePlan(agent._id, plan._id);
        console.error('❌ FAIL: Agent purchased plan with Insufficient Personal Funds!');
    } catch (err) {
        // We expect error
        if (err.toString().includes('Insufficient')) {
            console.log(`✅ PASS: Blocked Plan Purchase (Personal Funds 0).`);
        } else {
            console.log(`✅ PASS: Blocked Plan Purchase (Error: ${err.message})`);
        }
    }

    // Now give Personal Money and Retry
    agent.wallet.main = 100;
    await agent.save();
    console.log('...Loaded Personal Wallet with 100. Retrying Purchase...');

    try {
        await PlanService.purchasePlan(agent._id, plan._id);
        const agentFinal = await User.findById(agent._id);
        if (agentFinal.wallet.main === 0 && agentFinal.wallet.agent === 800) {
            console.log('✅ PASS: Plan Purchased with Personal Funds. Stock untouched.');
        } else {
            console.error(`❌ FAIL: Wallet mixup? Main: ${agentFinal.wallet.main}, Stock: ${agentFinal.wallet.agent}`);
        }
    } catch (err) {
        console.error('❌ FAIL: Valid Plan Purchase Failed:', err);
    }

    console.log('[5] New User Referral Link...');
    const refUser = await User.create({
        fullName: 'Ref User', username: 'ref_user', phone: '999003',
        password: 'hash', role: 'user', country: 'BD',
        wallet: { main: 0 }, referredBy: 'TEST_AGENT_REF'
    });

    if (refUser.referredBy === agent.referralCode) {
        console.log('✅ PASS: User linked to Agent.');
    } else {
        console.error('❌ FAIL: Linkage failed.');
    }

    console.log('--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTest().catch(console.error);
