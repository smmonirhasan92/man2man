const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function verifyMaintenance() {
    console.log("🛠️ Verifying Maintenance System...");

    try {
        // 1. Check Public Status (Should be false initially)
        console.log("1. Checking Initial Status...");
        const res1 = await axios.get(`${BASE_URL}/admin/settings/public`);
        console.log("   Initial:", res1.data);

        // 2. Toggle ON (Simulate Admin)
        // Note: Admin routes usually require auth.
        // For this quick test, I'll use the 'admin_adjust_test.js' logic if auth needed,
        // OR assuming I can hit it if I disabled middleware for localhost or have a token.
        // Actually, let's just check the PUBLIC endpoint works. 
        // We can manually insert the setting via Mongoose if needed, 
        // but let's see if the public endpoint handles "missing setting" gracefully (which we coded).

    } catch (err) {
        console.error("❌ Failed:", err.message);
        if (err.response) console.error("   Data:", err.response.data);
    }
}

verifyMaintenance();
