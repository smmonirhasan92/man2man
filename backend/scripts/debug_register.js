const axios = require('axios');

async function testRegister() {
    try {
        console.log("👉 attempting register user...");
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            fullName: "Debug User",
            primary_phone: "01711111111", // New Schema
            password: "password123",
            country: "BD"
        });
        console.log("✅ Register Success:", res.data);
    } catch (e) {
        console.error("❌ Register Failed:", e.response ? e.response.data : e.message);
        console.error("   Status:", e.response ? e.response.status : "Unknown");
    }
}

testRegister();
