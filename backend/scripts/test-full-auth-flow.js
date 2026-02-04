const axios = require('axios');

async function testFullAuthFlow() {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const newUser = {
        fullName: `Test User ${randomSuffix}`,
        phone: `01700${randomSuffix}`,
        country: "Bangladesh",
        password: "Password@123"
    };

    console.log("--- STARTING FULL AUTH FLOW TEST ---");
    console.log("Target User:", newUser);

    try {
        // 1. REGISTER
        console.log("\n1. Testing Registration...");
        const regRes = await axios.post('http://localhost:5000/api/auth/register', newUser);
        console.log("   ✅ Registration Success!");
        console.log("   Token received:", regRes.data.token ? "YES" : "NO");
        const token = regRes.data.token;

        if (!token) throw new Error("No token received after registration!");

        // 2. AUTO-LOGIN (Verify Token)
        console.log("\n2. Testing Auto-Login (Token Verification)...");
        try {
            const meRes = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { 'x-auth-token': token }
            });
            console.log("   ✅ Auto-Login Success!");
            console.log("   User Data:", meRes.data.fullName);
        } catch (meErr) {
            console.error("   ❌ Auto-Login FAILED:", meErr.response ? meErr.response.data : meErr.message);
            throw meErr;
        }

        // 3. MANUAL LOGIN
        console.log("\n3. Testing Manual Login...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            phone: newUser.phone,
            password: newUser.password
        });
        console.log("   ✅ Manual Login Success!");
        console.log("   Token received:", loginRes.data.token ? "YES" : "NO");

        console.log("\n--- TEST COMPLETED SUCCESSFULLY ---");

    } catch (error) {
        console.error("\n❌ TEST FAILED:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Message:", error.response.data);
        } else {
            console.error("   Error:", error.message);
        }
    }
}

testFullAuthFlow();
