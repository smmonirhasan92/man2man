const mongoose = require('mongoose');
const TaskServiceV2 = require('../modules/task/TaskServiceV2');
const Plan = require('../modules/admin/PlanModel');
const User = require('../modules/user/UserModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const TaskAd = require('../modules/task/TaskAdModel'); // For creating dummy task

// Hardcoded for reliability
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function dryRun() {
    try {
        console.log("🚀 [DRY RUN] Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");

        // 1. Create Mock User
        const mockEmail = `dryrunv2_${Date.now()}@test.com`;
        const mockPhone = `+1${Math.floor(Math.random() * 1000000000)}`;

        let user = await User.create({
            name: "Dry Run Tester",
            fullName: "Dry Run Tester", // Schema uses fullName
            username: `dryrun_${Date.now()}`, // Schema requires username
            email: mockEmail,
            primary_phone: mockPhone, // Schema requires primary_phone
            country: "USA", // Schema requires country
            password: "hashedpassword123",
            wallet: { main: 100000, income: 0, game: 0 }
        });
        console.log(`\n👤 Created Mock User: ${user.email} (ID: ${user._id})`);

        // --- TEST CASE 1: Standard Node (500 BDT) ---
        await runTest(user._id, "PLAN_V2_01", 500);

        // --- TEST CASE 2: Tycoon Node (15,000 BDT) ---
        await runTest(user._id, "PLAN_V2_10", 15000);

        console.log("\n✨ Dry Run Validation Complete: ALL SYSTEMS GO.");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ DRY RUN FAILED:", err);
        process.exit(1);
    }
}

async function runTest(userId, planCode, price) {
    console.log(`\n🧪 Testing Plan: ${planCode} (Price: ${price})`);

    // A. Fetch Plan
    const plan = await Plan.findOne({ node_code: planCode });
    if (!plan) throw new Error(`Plan ${planCode} not found! Run seed script first.`);

    // B. Simulate Purchase (Direct DB Insert to skip PlanService overhead)
    const activeDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(activeDate.getDate() + 35);

    const syntheticKey = `USA_KEY_${Math.floor(Math.random() * 10000)}`;

    const userPlan = await UserPlan.create({
        userId,
        planId: plan._id,
        planName: plan.name,
        price_paid: plan.unlock_price,
        dailyLimit: plan.daily_limit,
        startDate: activeDate,
        expiryDate: expiryDate,
        status: 'active',
        syntheticPhone: syntheticKey,
        tasksCompletedToday: 0
    });
    console.log(`   Detailed Purchase: ${plan.name} [Active] Key: ${syntheticKey}`);

    // C. Expected Math
    const expectedTotal = price * 1.6;
    const expectedDaily = expectedTotal / 35;
    const expectedTask = parseFloat((expectedDaily / 10).toFixed(4));
    console.log(`   Expectation: Total=${expectedTotal} | Daily=${expectedDaily.toFixed(4)} | Task=${expectedTask}`);

    // D. Create Dummy Task for Server strict match
    // Ensure a task exists for this server
    const dummyTask = await TaskAd.findOneAndUpdate(
        { title: `Dry Run Task ${plan.server_id}` },
        {
            title: `Dry Run Task ${plan.server_id}`,
            url: "http://exampl.com",
            duration: 5,
            reward_amount: 999, // Should be ignored by V2 dynamic logic if plan has task_reward
            server_id: plan.server_id,
            is_active: true,
            priority: 100
        },
        { upsert: true, new: true }
    );
    // console.log(`   Ensured Task exists for ${plan.server_id}`);

    // E. Execute Task V2
    console.log(`   ▶ Executing TaskServiceV2.completeTask...`);
    const result = await TaskServiceV2.completeTask(userId, dummyTask._id, syntheticKey);

    // F. Verification
    if (result.reward !== expectedTask) {
        throw new Error(`MISMATCH! Got ${result.reward}, Expected ${expectedTask}`);
    }
    console.log(`   ✅ SUCCESS: Reward matches exactly: ${result.reward}`);

    // G. Verify User Balance
    const updatedUser = await User.findById(userId);
    console.log(`   💰 User Income Wallet: ${updatedUser.wallet.income}`);
}

dryRun();
