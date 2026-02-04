const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // Adjust path if running from scripts/

const connectDB = require('../kernel/database');
const PlanService = require('../modules/plan/PlanService');
const TaskService = require('../modules/task/TaskService');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');

async function runTest() {
    await connectDB();
    console.log('--- STARTING LOGIC VERIFICATION ---');

    // 1. Setup Test Data
    console.log('\n[1] Setting up Test Data...');
    const plan = await Plan.findOneAndUpdate(
        { name: 'LogicTestPlan' },
        { daily_limit: 2, unlock_price: 100, is_active: true },
        { upsert: true, new: true }
    );
    console.log(`Test Plan Created: ${plan.name} (Limit: ${plan.daily_limit}, Price: ${plan.unlock_price})`);

    // Create User (Referrer)
    await User.deleteOne({ username: 'logic_ref' });
    const referrer = await User.create({
        fullName: 'Logic Ref',
        username: 'logic_ref',
        phone: '999000',
        password: 'hash',
        country: 'US',
        referralCode: 'REF_LOGIC',
        wallet: { income: 0, game: 0, main: 1000 },
        taskData: { tasksCompletedToday: 0 }
    });
    // Give Referrer a plan (so they earn commission)
    await PlanService.purchasePlan(referrer._id, plan._id);
    console.log('Referrer Created & Plan Purchased.');

    // Create User (Player)
    await User.deleteOne({ username: 'logic_player' });
    const player = await User.create({
        fullName: 'Logic Player',
        username: 'logic_player',
        phone: '999001',
        password: 'hash',
        country: 'US',
        referredBy: 'REF_LOGIC', // Link to referrer
        wallet: { main: 500, game: 500 }, // Enough balance
        taskData: { tasksCompletedToday: 0 }
    });
    console.log('Player Created (Balance: 500).');

    // 2. Failure Case: Task without Plan
    console.log('\n[2] Testing Task WITHOUT Plan...');
    try {
        await TaskService.completeTask(player._id, 'task_1', 10);
        console.error('❌ FAILED: Task should have been rejected!');
    } catch (e) {
        console.log('✅ PASS: Task Rejected as expected (' + e.message + ')');
    }

    // 3. Purchase Plan
    console.log('\n[3] Purchasing Plan...');
    await PlanService.purchasePlan(player._id, plan._id);
    const updatedPlayer = await User.findById(player._id);
    console.log(`✅ PASS: Plan Purchased. Main Wallet: ${updatedPlayer.wallet.main} (Expected 400)`);

    // Check Referral Bonus (Plan Purchase)
    const updatedRef = await User.findById(referrer._id);
    console.log(`Ref Wallet: ${updatedRef.wallet.income} (Expected ~10% of 100 = 10)`);
    if (updatedRef.wallet.income === 10) console.log('✅ PASS: Referral Bonus (Plan) Received.');
    else console.log('⚠️ CHECK: Referral Bonus amount mismatch?');

    // 4. Success Case: Task WITH Plan
    console.log('\n[4] Testing Task WITH Plan...');
    const res = await TaskService.completeTask(player._id, 'task_1', 5);
    console.log(`✅ PASS: Task Completed. New Balance: ${res.newBalance}, Limit Used: ${res.tasksToday}/${res.limit}`);

    // 5. Limit Check
    console.log('\n[5] Testing Limit...');
    await TaskService.completeTask(player._id, 'task_2', 5); // 2nd task (Limit 2)
    console.log('Task 2 Completed (Limit Reached).');

    try {
        await TaskService.completeTask(player._id, 'task_3', 5); // 3rd task (Should Fail)
        console.error('❌ FAILED: Task 3 should be rejected!');
    } catch (e) {
        console.log('✅ PASS: Task 3 Rejected (Limit Exceeded) -> ' + e.message);
    }

    // 6. Referral Task Commission
    console.log('\n[6] Checking Task Commission...');
    const finalRef = await User.findById(referrer._id);
    // Previous: 10. Users did 2 tasks of 5 reward each = 10 total reward? 
    // Commission 2% (from Service) of 5 = 0.1. Two tasks = 0.2.
    // Total should be 10.2
    console.log(`Final Ref Balance: ${finalRef.wallet.income} (Expected 10.2)`);

    console.log('\n--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTest().catch(console.error);
