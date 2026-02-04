const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const TaskAd = require('../modules/task/TaskAdModel');

const API_URL = 'http://localhost:5000/api';

// Utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLiveDemo() {
    try {
        console.log("\n🚀 STARTING LIVE GLOBAL DEMO: FULL USER JOURNEY\n");
        console.log("------------------------------------------------");

        // 1. LOGIN ADMIN (To Setup Environment)
        console.log("👮 [Step 1] Logging in as Super Admin...");
        let adminToken;
        try {
            const adminRes = await axios.post(`${API_URL}/auth/login`, {
                primary_phone: "01700000000",
                password: "123456"
            });
            adminToken = adminRes.data.token;
            console.log("   ✅ Admin Logged In.");
        } catch (e) {
            console.error("   ❌ Admin Login Failed. Is the server running? Did you run the cleanup?", e.message);
            return;
        }

        // 2. SETUP: Ensure Valid Plan and TaskAd Exists
        console.log("\n🛠️ [Step 2] Setting up Test Environment (Plan & Task)...");
        // We'll do this via DB directly for speed/reliability in the script, 
        // ensuring the exact ID is known.
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });

        // Create/Find Plan
        let plan = await Plan.findOne({ name: "Demo Plan" });
        if (!plan) {
            plan = await Plan.create({
                name: "Demo Plan",
                unlock_price: 100,
                daily_limit: 5,
                task_reward: 10,
                validity_days: 30,
                is_active: true
            });
            console.log("   - Created 'Demo Plan' (Price: 100, Reward: 10)");
        } else {
            console.log("   - Found existing 'Demo Plan'");
        }

        // Create/Find Task Ad
        await TaskAd.deleteMany({}); // CLEANUP OLD ONES
        let taskAd = await TaskAd.findOne({ title: "Demo Task" });
        if (!taskAd) {
            taskAd = await TaskAd.create({
                title: "Demo Task",
                reward_amount: 10,
                duration: 5, // shortened
                url: 'https://google.com',
                is_active: true
            });
            console.log("   - Created 'Demo Task' (Duration: 5s)");
        } else {
            console.log("   - Found existing 'Demo Task'");
        }


        // 3. REGISTER NEW USER
        const demoPhone = "019" + Math.floor(10000000 + Math.random() * 90000000);
        console.log(`\n👤 [Step 3] Registering New User: ${demoPhone}...`);

        let userToken;
        let userId;
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                fullName: "Demo User",
                primary_phone: demoPhone,
                password: "password123",
                country: "US"
            });
            userToken = regRes.data.token;
            userId = regRes.data.user.id;
            console.log("   ✅ User Registered & Logged In.");
        } catch (e) {
            console.error("   ❌ Registration Failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 4. ADMIN ADDS FUNDS
        console.log("\n💰 [Step 4] Admin adding funds to User...");
        try {
            await axios.post(`${API_URL}/admin/user/${userId}/balance`, {
                amount: 500,
                type: 'credit',
                walletType: 'main',
                comment: 'Live Demo Funding'
            }, { headers: { 'x-auth-token': adminToken } });
            console.log("   ✅ Fund Added. User Balance should be 500.");
        } catch (e) {
            console.error("   ❌ Funding Failed:", e.response ? e.response.data : e.message);
        }

        // VERIFY BALANCE
        const meRes1 = await axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': userToken } });
        console.log(`   👉 Current Balance: ${meRes1.data.wallet.main}`);


        // 5. USER BUYS PLAN
        console.log("\n🛒 [Step 5] User Buying 'Demo Plan'...");
        try {
            await axios.post(`${API_URL}/plan/purchase/${plan._id}`, {}, { headers: { 'x-auth-token': userToken } });
            console.log("   ✅ Plan Purchased Successfully!");
        } catch (e) {
            console.error("   ❌ Plan Purchase Failed:", e.response ? e.response.data : e.message);
            if (e.response?.data?.message === 'Plan already active') console.log("   (User already had plan)");
            else return;
        }

        // 5.5 WAIT FOR PROVISIONING (Simulate 25s wait for 12s Timer)
        console.log("   ⏳ Waiting 25s for Server Provisioning & Phone Assignment...");
        await sleep(25000);

        // Verify Synthetic Phone
        const meResProvisioned = await axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': userToken } });
        console.log("   🔍 GET ME Response:", JSON.stringify(meResProvisioned.data)); // DEBUG

        const synPhone = meResProvisioned.data.user ? meResProvisioned.data.user.synthetic_phone : null;
        if (synPhone) {
            console.log(`   🇺🇸 ✅ SYNTHETIC PHONE ASSIGNED: ${synPhone}`);
        } else {
            console.error("   ❌ Synthetic Phone NOT Assigned after waiting!");
            // return;
        }

        // 6. USER PERFORMS TASK
        console.log("\n🎮 [Step 6] User Performing Task...");

        // A. Start
        console.log("   - Starting Task...");
        try {
            const startRes = await axios.post(`${API_URL}/task/start`, { taskId: taskAd._id }, { headers: { 'x-auth-token': userToken } });
            console.log(`   ✅ Task Started at ${startRes.data.startTime}`);
        } catch (e) {
            console.error("   ❌ Start Task Failed:", e.response ? e.response.data : e.message);
            return;
        }

        // B. Wait
        console.log("   dw (Waiting 6 seconds for validity)...");
        await sleep(6100);

        // C. Submit
        console.log("   - Submitting Task...");
        try {
            const submitRes = await axios.post(`${API_URL}/task/submit`, {
                taskId: taskAd._id,
                answer: "Demo Answer"
            }, { headers: { 'x-auth-token': userToken } });

            console.log("   ✅ Task Submitted!");
            console.log(`   🎉 New Income Balance: ${submitRes.data.newBalance}`);
        } catch (e) {
            console.error("   ❌ Submit Task Failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 7. FINAL VERIFICATION
        console.log("\n🕵️ [Step 7] Final Verification...");
        const finalMe = await axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': userToken } });
        console.log("   User Wallet State:");
        console.log(`   - Main:   ${finalMe.data.wallet.main} (Deducted 100 for plan)`);
        console.log(`   - Income: ${finalMe.data.wallet.income} (Earned 10 from task)`);

        if (finalMe.data.wallet.income >= 10) {
            console.log("\n✅✅ LIVE DEMO SUCCESSFUL: FULL CYCLE COMPLETE ✅✅");
        } else {
            console.log("\n⚠️ DEMO PARTIAL: Income verification failed.");
        }

    } catch (e) {
        console.error("Global Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runLiveDemo();
