const axios = require('axios');

const BASE_URL = 'https://man2man-api.onrender.com';

async function testConnection() {
    console.log(`[TEST] Pinging ${BASE_URL} (Root) ...`);
    try {
        const res = await axios.get(`${BASE_URL}/`, { validateStatus: () => true }); // Accept all status codes
        console.log(`[RESULT] Root Status: ${res.status}`);
        console.log(`[RESULT] Headers:`, JSON.stringify(res.headers, null, 2));
        console.log(`[RESULT] Data:`, typeof res.data === 'object' ? JSON.stringify(res.data) : res.data);
    } catch (err) {
        console.error(`[FAIL] Root Ping Error: ${err.message}`);
    }

    console.log(`\n[TEST] Pinging ${BASE_URL}/api ...`);
    try {
        const res = await axios.get(`${BASE_URL}/api`, {
            headers: { 'User-Agent': 'NodeVerifyScript' },
            validateStatus: () => true
        });
        console.log(`[RESULT] API Root Status: ${res.status}`);
        console.log(`[RESULT] Headers:`, JSON.stringify(res.headers, null, 2));
    } catch (err) {
        console.error(`[FAIL] API Root Pending Error: ${err.message}`);
    }
}

async function testAdminLogin() {
    console.log(`\n[TEST] Attempting Admin Login (01700000000)...`);
    try {
        const res = await axios.post(`${BASE_URL}/api/auth/login`, {
            phone: '01700000000',
            password: '123456'
        }, { validateStatus: () => true });

        console.log(`[RESULT] Login Status: ${res.status}`);
        if (res.status === 200) {
            console.log(`[SUCCESS] User: ${res.data.user?.username}`);
            console.log(`[SUCCESS] Token: ${res.data?.token?.substring(0, 10)}...`);
        } else {
            console.log(`[FAIL] Login Response:`, JSON.stringify(res.data));
        }
    } catch (err) {
        console.error(`[FAIL] Login Error: ${err.message}`);
    }
}

async function run() {
    await testConnection();
    await testAdminLogin();
}

run();
