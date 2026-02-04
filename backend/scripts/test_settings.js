const axios = require('axios');

async function testSettings() { // renamed function to avoid collision
    console.log("⚙️ TESTING SETTINGS ENDPOINT...");
    const url = 'http://localhost:5000/api/settings/public';
    try {
        const res = await axios.get(url);
        console.log("✅ STATUS:", res.status);
        console.log("✅ DATA:", res.data);
    } catch (e) {
        console.error("❌ FAILED:", e.message);
        if (e.response) {
            console.error("   Status:", e.response.status);
            console.error("   Data:", e.response.data);
        }
    }
}

testSettings();
