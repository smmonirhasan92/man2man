const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');

const BASE_URL = 'http://localhost:5000/api';
let TOKEN = '';
let USER_ID = '';
let PLAN_ID = '';

async function run() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01755555555',
            password: '123456'
        });
        TOKEN = loginRes.data.token;
        USER_ID = loginRes.data.user.id;
        console.log('1. Login Success:', USER_ID);

        // 2. Check Tasks (Should be BLOCKED or Empty Active Plans)
        // Frontend uses local guard, but API should also return limit=0 or error.
        try {
            const taskStatus = await axios.get(`${BASE_URL}/task/status`, { headers: { 'x-auth-token': TOKEN } });
            console.log('2. Pre-Plan Status:', taskStatus.data);
            if (taskStatus.data.dailyLimit > 0) console.warn('WARNING: User has limit > 0 without plan!');
        } catch (e) {
            console.log('2. Pre-Plan Status Check (Expected):', e.response?.data || e.message);
        }

        // 3. Get Plans
        const plansRes = await axios.get(`${BASE_URL}/plan`, { headers: { 'x-auth-token': TOKEN } });
        const starterPlan = plansRes.data.find(p => p.price === 0);
        if (!starterPlan) throw new Error('Starter Plan not found');
        PLAN_ID = starterPlan._id;
        console.log('3. Found Starter Plan:', starterPlan.name);

        // 4. Purchase Plan
        console.log('4. Purchasing Plan...');
        await axios.post(`${BASE_URL}/plan/purchase/${PLAN_ID}`, {}, { headers: { 'x-auth-token': TOKEN } });
        console.log('   Purchase Successful!');

        // 5. Verify Tasks Unlocked
        const taskStatusAfter = await axios.get(`${BASE_URL}/task/status`, { headers: { 'x-auth-token': TOKEN } });
        console.log('5. Post-Plan Status:', taskStatusAfter.data);
        if (taskStatusAfter.data.dailyLimit !== 5) throw new Error('Daily Limit mismatch!');

        console.log('--- VERIFICATION COMPLETE: ALL SYSTEMS GO ---');

    } catch (err) {
        console.error('FATAL ERROR:', err.response?.data || err.message);
    }
}

run();
