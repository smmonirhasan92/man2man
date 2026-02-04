const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '../.env' }); // Adjust path if running from scripts/

const BASE_URL = 'http://localhost:5000/api';
const LOCAL_MONGO = 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';

async function run() {
    console.log('--- UI/UX GRID COUNT VERIFICATION ---');

    // 1. Database Prep (Set Plan for test55)
    await mongoose.connect(LOCAL_MONGO, { family: 4 });
    const User = require('../modules/user/UserModel'); // Adjust path
    const Plan = require('../modules/admin/PlanModel');

    // Create Dummy Plan if needed
    let plan = await Plan.findOne({ name: 'UI_TEST_PLAN' });
    if (!plan) {
        plan = await Plan.create({
            name: 'UI_TEST_PLAN',
            price: 0,
            daily_limit: 20, // <--- TARGET LIMIT
            task_reward: 5,
            validity_days: 1
        });
    }

    // Reset User 'test55'
    const UserPlan = require('../modules/plan/UserPlanModel'); // New dependency

    // Reset User 'test55'
    let user = await User.findOne({ primary_phone: 'test55' });
    if (user) {
        user.taskData.tasksCompletedToday = 0;
        user.taskData.lastTaskDate = new Date(0);
        await user.save();

        // Correct Way: Create UserPlan Document
        await UserPlan.deleteMany({ userId: user._id }); // Clear old
        await UserPlan.create({
            userId: user._id,
            planId: plan._id,
            planName: plan.name,
            dailyLimit: plan.daily_limit,
            expiryDate: new Date(Date.now() + 86400000),
            status: 'active',
            serverIp: '127.0.0.1'
        });

        console.log(`[DB] User 'test55' reset (Created UserPlan with Limit: 20)`);
    } else {
        console.error("User 'test55' not found. Run verify_dynamic_key.js first.");
        process.exit(1);
    }

    await mongoose.disconnect();

    // 2. API Flow
    try {
        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            primary_phone: 'test55',
            password: '123456'
        });
        const token = loginRes.data.token;
        let usaKey = loginRes.data.user.synthetic_phone;

        if (!usaKey) {
            console.log("Key missing, generating...");
            try {
                const kRes = await axios.post(`${BASE_URL}/task/generate-key`, {}, { headers: { Authorization: `Bearer ${token}` } });
                usaKey = kRes.data.key;
            } catch (e) { console.error("Key Gen Failed", e.response?.data); }
        }

        if (!usaKey) throw new Error("No USA Key found on user.");

        // Check Initial Status
        console.log('\n--- INITIAL STATE ---');
        const statusRes1 = await axios.get(`${BASE_URL}/task/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const limit1 = statusRes1.data.dailyLimit;
        const completed1 = statusRes1.data.completedToday;
        const gridCount1 = limit1 - completed1;
        console.log(`Daily Limit: ${limit1}`);
        console.log(`Completed:   ${completed1}`);
        console.log(`GRID COUNT:  ${gridCount1} (Expect 20)`);

        if (gridCount1 !== 20) throw new Error(`Expected 20, got ${gridCount1}`);

        // Perform Task
        console.log('\n--- EXECUTING TASK 1 ---');

        // Fetch specific task to get ID
        const tasksRes = await axios.get(`${BASE_URL}/task`, { headers: { Authorization: `Bearer ${token}` } });
        const taskId = tasksRes.data[0]?._id || tasksRes.data[0]?.id || "dummy_id";

        // Start
        await axios.post(`${BASE_URL}/task/start`, { taskId }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("Task Started...");

        // Wait 2s (Bypass full 10s for this test, assuming backend allows 5s check or we sleep)
        // Backend said diffSeconds < 5 throws error. So wait 6s.
        console.log("Waiting 6s for timer...");
        await new Promise(r => setTimeout(r, 6000));

        // Claim
        await axios.post(`${BASE_URL}/task/claim`, { taskId }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-usa-key': usaKey
            }
        });
        console.log("Task Claimed Successfully.");


        // Check Final Status
        console.log('\n--- FINAL STATE ---');
        const statusRes2 = await axios.get(`${BASE_URL}/task/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const limit2 = statusRes2.data.dailyLimit;
        const completed2 = statusRes2.data.completedToday;
        const gridCount2 = limit2 - completed2;

        console.log(`Daily Limit: ${limit2}`);
        console.log(`Completed:   ${completed2}`);
        console.log(`GRID COUNT:  ${gridCount2} (Expect 19)`);

        if (gridCount2 === 19) {
            console.log("\n✅ SUCCESS: Grid reduced by 1.");
        } else {
            console.error("\n❌ FAILED: Grid count incorrect.");
        }

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

run();
