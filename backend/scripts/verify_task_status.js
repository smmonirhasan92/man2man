const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function verifyTaskStatus() {
    try {
        console.log("👉 Login as test-usa...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01999999999',
            password: 'password'
        });
        const token = loginRes.data.token;
        console.log("✅ Login OK. Token obtained.");

        console.log("👉 Fetching Task Status...");
        const statusRes = await axios.get(`${API_URL}/task/status`, {
            headers: { 'x-auth-token': token }
        });

        console.log("✅ Task Status Response:");
        console.log(JSON.stringify(statusRes.data, null, 2));

    } catch (e) {
        console.error("❌ Verification Failed:", e.response ? e.response.data : e.message);
        if (e.response && e.response.status === 404) {
            console.error("   Reason: 404 Not Found. Check if routes are enabled in server.js");
        }
    }
}
verifyTaskStatus();
