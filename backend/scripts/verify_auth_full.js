const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function verifyAuth() {
    try {
        console.log("\n🧪 STARTING FULL AUTH TEST...\n");

        // 1. REGISTER
        const newPhone = "017" + Math.floor(10000000 + Math.random() * 90000000);
        console.log(`👉 Attempting Register with phone: ${newPhone}`);

        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                fullName: "Test User 2",
                primary_phone: newPhone,
                password: "password123",
                country: "BD"
            });
            console.log("✅ Register Success!");
            console.log("   Token:", regRes.data.token ? "RECEIVED" : "MISSING");
            console.log("   User ID:", regRes.data.user.id);
        } catch (e) {
            console.error("❌ Register Failed:", e.response ? e.response.data : e.message);
            if (e.response?.data?.message?.includes("duplicate")) {
                console.error("   CRITICAL: Duplicate Key Error still exists!");
            }
            return; // Stop if register fails
        }

        // 2. LOGIN (Super Admin)
        console.log("\n👉 Attempting Login as Super Admin (01700000000 / 123456)...");
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                primary_phone: "01700000000",
                password: "123456"
            });
            console.log("✅ Admin Login Success!");
            console.log("   Role:", loginRes.data.user.role);

            // 3. CHECK /me
            console.log("\n👉 Checking /auth/me for Admin...");
            const meRes = await axios.get(`${API_URL}/auth/me`, {
                headers: { 'x-auth-token': loginRes.data.token }
            });
            console.log("✅ /auth/me Success! Status: 200");
            console.log("   Balance:", meRes.data.wallet.main);

        } catch (e) {
            console.error("❌ Login/Me Failed:", e.response ? e.response.data : e.message);
        }

    } catch (e) {
        console.error("Global Error:", e);
    }
}
verifyAuth();
