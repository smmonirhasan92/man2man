const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'api_task_flow_logs.json';

const userCreds = { phone: '01912345678', password: 'password' };

const logBuffer = [];

function log(step, data) {
    console.log(`\n[${step}]`);
    console.log(JSON.stringify(data, null, 2));
    logBuffer.push({ step, data });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logBuffer, null, 2));
}

const TaskAd = require('../modules/task/TaskAdModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const User = require('../modules/user/UserModel');

async function runTest() {
    console.log("🚀 STARTING TASK API VERIFICATION...");

    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

        // 0. Ensure Task Exists
        let task = await TaskAd.findOne({ title: 'API Test Task' });
        if (!task) {
            task = await TaskAd.create({
                title: 'API Test Task',
                url: 'http://example.com',
                duration: 5,
                reward_amount: 50,
                type: 'ad_view',
                is_active: true
            });
            console.log("✅ API Test Task Created");
        }

        // 1. LOGIN
        console.log("👉 Login...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, userCreds);
        console.log(`[DEBUG] Login Response Keys:`, Object.keys(loginRes.data));
        if (loginRes.data.user) console.log(`[DEBUG] Login User:`, loginRes.data.user);

        const token = loginRes.data.token;
        const headers = { 'x-auth-token': token };

        // DEBUG: Check DB Users
        const userCount = await User.countDocuments({});
        console.log(`[DEBUG] Total Users in DB: ${userCount}`);
        const debugUser = await User.findOne({ primary_phone: userCreds.phone });
        console.log(`[DEBUG] FindOne by Phone result: ${debugUser ? debugUser._id : 'null'}`);


        // 2. CHECK INITIAL INCOME
        const balRes1 = await axios.get(`${API_URL}/wallet/balance`, { headers });
        const startIncome = balRes1.data.income_balance;
        log('1. Initial Income', { income: startIncome });

        // 2.5 ENSURE ACTIVE PLAN (Buy + Fast Forward)
        console.log("👉 Ensuring Active Plan & Fast-Forwarding...");

        // A. Buy Plan if needed
        let plan = await Plan.findOne({ name: 'API Test Plan' });
        if (!plan) {
            plan = await Plan.create({ name: 'API Test Plan', unlock_price: 100, daily_limit: 5, validity_days: 7, is_active: true });
        }
        const planId = plan._id.toString();

        try {
            await axios.post(`${API_URL}/plan/purchase/${planId}`, {}, { headers });
            console.log("✅ Plan Purchased via API.");
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            if (msg.includes('active server rental') || msg.includes('already have')) {
                console.log("✅ User already has a plan (API check).");
            } else {
                console.warn("⚠️ Plan Purchase Warning:", msg);
            }
        }

        // B. Fast Forward to ACTIVE (Direct DB)
        // Attempt to get ID from Login Response first
        let targetUserId = loginRes.data.user ? (loginRes.data.user.id || loginRes.data.user._id) : null;

        if (!targetUserId) {
            // Fallback: Find by Phone
            const user = await User.findOne({ primary_phone: userCreds.phone });
            if (user) targetUserId = user._id;
        }

        if (targetUserId) {
            log('DEBUG', { msg: `Target User ID found: ${targetUserId}` });
            const plans = await UserPlan.find({ userId: targetUserId });
            log('DEBUG', { msg: `Plans found before update: ${plans.length}`, plans: plans.map(p => ({ id: p._id, status: p.status, userId: p.userId })) });

            // FORCE ACTIVE STATUS AND FUTURE EXPIRY
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const res = await UserPlan.updateMany({ userId: targetUserId }, {
                status: 'active',
                expiryDate: futureDate,
                provisioningUntil: new Date() // Past date
            });
            log('DEBUG', { msg: `Update Result: matched=${res.matchedCount}, modified=${res.modifiedCount}` });

            if (res.matchedCount > 0) console.log(`⚡ Plan Fast-Forwarded to ACTIVE`);
            else console.log(`ℹ️ Plan status already active or not updateable.`);
        } else {
            console.warn("⚠️ User not found for fast-forward (Check Login Response).");
            log('DEBUG', { msg: "User NOT FOUND for fast forward", loginData: loginRes.data });
        }

        // 3. GET TASKS
        console.log("👉 Fetching Tasks...");
        const tasksRes = await axios.get(`${API_URL}/task`, { headers });
        const tasks = tasksRes.data;

        if (!Array.isArray(tasks) || tasks.length === 0) {
            log('2. Tasks Found', tasks);
            throw new Error("No tasks available to test.");
        }

        const targetTask = tasks[0];
        const taskId = targetTask._id || targetTask.id;

        // 4. START TASK
        console.log(`👉 Starting Task ${taskId}...`);
        const startRes = await axios.post(`${API_URL}/task/start`, { taskId }, { headers });
        log('3. Task Started', startRes.data);

        // Wait 6 seconds
        console.log("⏳ Waiting 6s for task completion...");
        await new Promise(r => setTimeout(r, 6000));

        // 5. SUBMIT TASK
        console.log("👉 Submitting Task...");
        const submitRes = await axios.post(`${API_URL}/task/submit`, {
            taskId,
            answer: "viewed"
        }, { headers });
        log('4. Task Submitted', submitRes.data);

        // 6. CHECK FINAL INCOME
        const balRes2 = await axios.get(`${API_URL}/wallet/balance`, { headers });
        const endIncome = balRes2.data.income_balance;
        log('5. Final Income', { income: endIncome });

        if (endIncome <= startIncome) {
            throw new Error(`Income Wallet did not increase! Start: ${startIncome}, End: ${endIncome}`);
        }
        console.log("✅✅ API TASK FLOW VERIFIED! ✅✅");

    } catch (error) {
        console.error("❌ TEST FAILED: " + error.message);
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
            log('ERROR RESPONSE', error.response.data);
        }
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    }
}

runTest();
