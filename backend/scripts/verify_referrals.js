const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const connectDB = require('../kernel/database');
const PlanService = require('../modules/plan/PlanService');
const TaskService = require('../modules/task/TaskService');
const ReferralService = require('../modules/referral/ReferralService');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const adminController = require('../controllers/adminController');

// Mock Req/Res for Admin Controller
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.body = data; return res; };
    return res;
};

async function runTest() {
    await connectDB();
    console.log('--- STARTING REFERRAL VERIFICATION ---');

    console.log('[1] Setting up Data...');
    // Create Plan
    const plan = await Plan.findOneAndUpdate({ name: 'RefPlan' }, { daily_limit: 2, unlock_price: 100, is_active: true }, { upsert: true, new: true });

    // Create Referrer
    await User.deleteOne({ username: 'ref_master' });
    const referrer = await User.create({
        fullName: 'Master Ref', username: 'ref_master',
        phone: '888000', primary_phone: '888000', password: 'hash', referralCode: 'REF_MASTER',
        wallet: { main: 1000, income: 0 }, agentData: { due: 0, milestoneLevel: 0 },
        country: 'US'
    });
    // Activate Referrer
    await PlanService.purchasePlan(referrer._id, plan._id);

    // Create 10 Downlines (To hit Milestone 10)
    console.log('[2] Creating 10 Active Downlines...');
    const downlines = [];
    for (let i = 0; i < 10; i++) {
        const username = `downline_${i}`;
        await User.deleteOne({ username });
        const user = await User.create({
            fullName: `Downline ${i}`, username,
            phone: `88800${i + 1}`, primary_phone: `88800${i + 1}`, password: 'hash', referredBy: 'REF_MASTER',
            wallet: { main: 200 }, referralCode: `REF_DL_${i}`,
            country: 'US'
        });
        // Activate Plan to make them "Active"
        await PlanService.purchasePlan(user._id, plan._id);
        downlines.push(user);
    }

    // Verify Milestone Bonus
    console.log('[3] Checking Milestone Bonus...');
    // We need to trigger the check. Usually triggered by plan purchase.
    // The last purchase above should have triggered it.
    const updatedRef = await User.findById(referrer._id);
    console.log(`Referrer Income: ${updatedRef.wallet.income}`);
    // Expected: 
    // Plan Commission: 10 users * 100 price * 5% = 50 TK.
    // Milestone Reward: 10 Active Users = 500 TK.
    // Total: 550.

    if (updatedRef.wallet.income >= 550) {
        console.log('✅ PASS: Milestone (500) + Plan Commissions (50) received.');
    } else {
        console.error(`❌ FAIL: Expected >= 550, got ${updatedRef.wallet.income}`);
    }

    // Verify Task Commission Logic
    console.log('[4] Checking Task Commission Constraint...');
    const worker = downlines[0];
    // Plan Limit is 2.
    // Do Task 1
    await TaskService.completeTask(worker._id, 'task_1', 10);
    const refAfterTask1 = await User.findById(referrer._id);

    // Previous Code: paid on every task. 
    // New Code: only pay on LAST task (>= limit).
    // So after Task 1 (1/2), commission should be STATIC (no change from 550).
    const isUnchanged = refAfterTask1.wallet.income === updatedRef.wallet.income;
    if (isUnchanged) {
        console.log('✅ PASS: Commission NOT paid on Task 1/2.');
    } else {
        console.error(`❌ FAIL: Commission paid early! Balance: ${refAfterTask1.wallet.income}`);
    }

    // Do Task 2 (Limit Reached)
    await TaskService.completeTask(worker._id, 'task_2', 10);
    const refAfterTask2 = await User.findById(referrer._id);

    // Now commission should come.
    // Amount: 10 (Reward) * 2 (Limit) = 20 Base.
    // Commission: 2% of 20 = 0.4.
    // Total should be 550 + 0.4 = 550.4
    if (refAfterTask2.wallet.income > refAfterTask1.wallet.income) {
        console.log(`✅ PASS: Commission Paid on Task 2/2. New Balance: ${refAfterTask2.wallet.income}`);
    } else {
        console.error('❌ FAIL: Commission NOT paid even after limit reached.');
    }

    console.log('[5] Checking Admin Tree...');
    const req = { params: { id: referrer._id } };
    const res = mockRes();
    await adminController.getUserReferralTree(req, res);

    if (res.body && res.body.children && res.body.children.length === 10) {
        console.log(`✅ PASS: Admin Tree shows 10 children.`);
        console.log(`Sample Child Status: ${res.body.children[0].status}`);
    } else {
        console.error('❌ FAIL: Admin Tree empty or mismatch.');
    }

    console.log('--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTest().catch(console.error);
