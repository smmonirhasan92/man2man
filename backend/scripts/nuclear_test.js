const axios = require('axios');

const BASE_URL = 'http://localhost:8002/api';
// Use a test user that definitely exists or create one
const TEST_USER = {
    phone: '01700000000', // Assuming this user exists from previous seeds or we will use a random one
    password: 'password123'
};

async function nuclearAuthTest() {
    console.log("☢️ STARTING NUCLEAR AUTH TEST ☢️");
    console.log(`Target: ${BASE_URL}`);

    try {
        // 1. Health/Ping (if endpoint exists)
        // 2. Try Login
        console.log(`\n[STEP 1] Attempting Login with ${TEST_USER.phone}...`);
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
            console.log("✅ LOGIN SUCCESS!");
            console.log("Token received:", loginRes.data.token ? "YES" : "NO");
            console.log("User Role:", loginRes.data.user.role);
        } catch (e) {
            console.error("❌ LOGIN FAILED:", e.response?.data || e.message);

            // If user not found, try register (optional, but good for nuclear test)
            if (e.response?.status === 404 || e.response?.data?.message?.includes('found')) {
                console.log("\n[STEP 1.5] User not found, attempting Register...");
                // Register logic here if needed, but for now let's stick to diagnosing connectivity
            }
        }

    } catch (e) {
        console.error("❌ CRITICAL NETWORK ERROR:", e.code || e.message);
        console.error("Is the backend server running on port 8002?");
    }
}

nuclearAuthTest();
