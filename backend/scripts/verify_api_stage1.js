const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
const Plan = require('../modules/admin/PlanModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'api_stage1_logs.json';

const adminCreds = { phone: '01700000000', password: 'password' };
const userCreds = { phone: '01912345678', password: 'password' };

const logBuffer = [];

function log(step, data) {
    console.log(`\n[${step}]`);
    console.log(JSON.stringify(data, null, 2));
    logBuffer.push({ step, data });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logBuffer, null, 2));
}

// Helper to create a plan in DB if not exists
async function ensurePlanExists() {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    let plan = await Plan.findOne({ name: 'API Test Plan' });
    if (!plan) {
        plan = await Plan.create({
            name: 'API Test Plan',
            unlock_price: 100, // Cheap for test
            daily_limit: 5,
            validity_days: 7,
            is_active: true
        });
        console.log("✅ API Test Plan Created");
    }
    await mongoose.disconnect();
    return plan;
}

async function runTest() {
    console.log("🚀 STARTING STAGE 1 & 2 API VERIFICATION...");

    try {
        // 0. Ensure Plan Exists
        const plan = await ensurePlanExists();
        const planId = plan._id.toString();

        // 1. ADMIN LOGIN (Check Initial Balance)
        console.log("👉 Admin Login...");
        const adminLogRes = await axios.post(`${API_URL}/auth/login`, adminCreds);
        const adminToken = adminLogRes.data.token;
        const adminHeaders = { 'x-auth-token': adminToken };

        const adminBal1 = await axios.get(`${API_URL}/wallet/balance`, { headers: adminHeaders });
        log('1. Admin Initial Balance', adminBal1.data);
        const adminIncomeStart = adminBal1.data.income_balance || 0;

        // 2. USER LOGIN
        console.log("👉 User Login...");
        const userLogRes = await axios.post(`${API_URL}/auth/login`, userCreds);
        const userToken = userLogRes.data.token;
        const userHeaders = { 'x-auth-token': userToken };

        const userBal1 = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
        log('2. User Initial Balance', userBal1.data);
        const userMainStart = userBal1.data.wallet_balance;

        // 3. PURCHASE PLAN (User)
        console.log(`👉 User Buying Plan (Price: ${plan.unlock_price})...`);
        try {
            const buyRes = await axios.post(`${API_URL}/plan/purchase/${planId}`, {}, { headers: userHeaders });
            log('3. Plan Purchase Response', buyRes.data);
        } catch (e) {
            throw new Error("Plan Buy Failed: " + (e.response?.data?.message || e.message));
        }

        // 4. VERIFY USER MAIN WALLET (Deduction)
        const userBal2 = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
        log('4. User Post-Purchase Balance', userBal2.data);

        if (userBal2.data.wallet_balance !== userMainStart - 100) {
            throw new Error(`User Main Wallet Deduction Failed! Expected ${userMainStart - 100}, Got ${userBal2.data.wallet_balance}`);
        }

        // 5. VERIFY ADMIN INCOME WALLET (Commission)
        // Admin is referrer of User. Level 1 = 10% of 100 = 10.
        const adminBal2 = await axios.get(`${API_URL}/wallet/balance`, { headers: adminHeaders });
        log('5. Admin Post-Commission Balance', adminBal2.data);

        // Check against known start + 10
        const expectedIncome = adminIncomeStart + 10;
        // Float tolerance check
        if (Math.abs(adminBal2.data.income_balance - expectedIncome) > 0.01) {
            throw new Error(`Commission Mismatch! Expected ${expectedIncome}, Got ${adminBal2.data.income_balance}`);
        }

        console.log("✅✅ FULL FLOW VERIFIED: Login -> Buy -> Deduct -> Commission ✅✅");

    } catch (error) {
        console.error("❌ TEST FAILED: " + error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
            log('ERROR RESPONSE', error.response.data);
        } else {
            console.error("No Response Data");
        }
        process.exit(1);
    }
}

runTest();
