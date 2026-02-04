const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';

async function run() {
    console.log('VERIFYING GATEWAY DATA REQUIREMENTS');

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: '01755555555',
            password: '123456'
        });
        AUTH_TOKEN = loginRes.data.token;
        console.log('Login Success.');

        // 2. Check Plan Logic (for Redirect)
        console.log('Checking /plan endpoint for activePlans...');
        const planRes = await axios.get(`${BASE_URL}/plan`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });

        const hasActivePlan = planRes.data.activePlans && planRes.data.activePlans.length > 0;
        console.log(`Has Active Plan? ${hasActivePlan ? 'YES' : 'NO'}`);

        if (hasActivePlan) {
            console.log('PASS: PlansPage WILL redirect to Gateway.');
        } else {
            console.log('FAIL: User has no active plan, logic wont trigger.');
        }

        // 3. Check User Data (for key verification)
        console.log('Checking User Synthetic Phone...');
        const userRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        const key = userRes.data.synthetic_phone || userRes.data.user?.synthetic_phone;
        console.log(`Key Found: ${key}`);

        if (key) {
            console.log('PASS: Gateway can verify this key.');
        } else {
            console.log('FAIL: No key to verify.');
        }

    } catch (err) {
        console.error('VERIFICATION FAILED:', err.message);
    }
}

run();
