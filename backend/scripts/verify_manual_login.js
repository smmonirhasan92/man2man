const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function verifyLogin() {
    try {
        console.log("👉 Attempting Login as test-usa...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            phone: '01999999999',
            password: 'password'
        });

        console.log("✅ Login Success!");
        console.log("   User:", res.data.user.username);
        console.log("   Token:", res.data.token.substring(0, 20) + "...");

        const token = res.data.token;
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { 'x-auth-token': token }
        });

        console.log("\n💰 Wallet Balance (Live):");
        console.log(JSON.stringify(meRes.data.wallet || meRes.data.w_dat, null, 2));

    } catch (e) {
        console.error("❌ Login Failed:", e.response ? e.response.data : e.message);
    }
}
verifyLogin();
