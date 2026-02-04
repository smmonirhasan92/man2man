const axios = require('axios');

async function testMint() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post('http://127.0.0.1:5050/api/auth/login', {
            email: 'admin@centralbank.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log("Logged in:", token ? "YES" : "NO");

        // 2. Mint 1000
        const mintRes = await axios.post('http://127.0.0.1:5050/api/admin/mint', {
            amount: 1000,
            pin: '0000'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("MINT SUCCESS:", mintRes.data);

        // 3. Get Stats
        const statsRes = await axios.get('http://127.0.0.1:5050/api/admin/stats/financial', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("STATS:", statsRes.data);

    } catch (e) {
        console.error("Mint Test Failed:", e.response?.data || e.message);
    }
}

testMint();
