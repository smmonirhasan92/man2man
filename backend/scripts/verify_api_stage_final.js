const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function verifyFinal() {
    try {
        console.log("👉 Login as test-usa (Primary Phone)...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            primary_phone: '01999999999',
            password: 'password'
        });
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log("✅ Login OK.");
        console.log("   User ID:", user.id);
        console.log("   Synthetic Phone:", user.synthetic_phone || "NONE");

        // 1. Check Identity Middleware (Should FAIL if no identity, but we have one?)
        // Test User Creation doesn't clearly set synthetic_phone? checking setup script...
        // It does NOT set synthetic_phone in the update object!
        // So this first detailed check SHOULD fail or return 403 if requireUSIdentity is strict.

        console.log("\n👉 [TEST 1] Access Task Status (protected by requireUSIdentity)...");
        try {
            const statusRes = await axios.get(`${API_URL}/task/status`, {
                headers: { 'x-auth-token': token }
            });
            console.log("✅ ACCESS GRANTED (User has identity?)");
            console.log("   Limits:", statusRes.data.dailyLimit);
        } catch (e) {
            console.log("⚠️ ACCESS DENIED (Expected if Identity Missing):", e.response?.data?.message);
            if (e.response?.status === 403) {
                console.log("✅ Middleware Working: 403 Forbidden received.");
            }
        }

    } catch (e) {
        console.error("❌ CRTICAL: Login Failed", e.response ? e.response.data : e.message);
    }
}
verifyFinal();
