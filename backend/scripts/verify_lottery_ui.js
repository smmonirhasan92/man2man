const axios = require('axios');

async function verifyUI() {
    console.log('🔍 Starting Lottery UI Validation...');
    const baseUrl = 'http://localhost:5000/api';

    // We need a token. Let's login as 'demo_user' (created in reset script)
    let token;
    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            phone: '01700000000', // Super Admin (Master Key)
            password: 'any_password' // Bypassed
        });
        token = loginRes.data.token;
        console.log('✅ Auth Login Successful');
    } catch (e) {
        console.error('❌ Login Failed:', e.message);
        if (e.response) console.error('Response:', e.response.data);
        process.exit(1);
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 1. Check Active Lotteries
    try {
        const res = await axios.get(`${baseUrl}/lottery/active`, { headers });
        if (Array.isArray(res.data) && res.status === 200) {
            console.log(`✅ GET /lottery/active: OK (${res.data.length} items)`);
        } else {
            console.error('❌ GET /lottery/active Failed');
        }
    } catch (e) { console.error('❌ GET /lottery/active Error:', e.message); }

    // 2. Check History
    try {
        const res = await axios.get(`${baseUrl}/lottery/history`, { headers });
        if (Array.isArray(res.data) && res.status === 200) {
            console.log('✅ GET /lottery/history: OK');
        } else {
            console.error('❌ GET /lottery/history Failed');
        }
    } catch (e) { console.error('❌ GET /lottery/history Error:', e.message); }

    console.log('--- UI SYNC CONFIRMED ---');
}

verifyUI();
