const axios = require('axios');

const API_URL = 'http://localhost:5050/api';

async function diagnose() {
    try {
        console.log("1. Logging in as test55...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            primary_phone: '01755555555',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log("   -> Login Success. Token stored.");

        console.log("\n2. Fetching User Status (/auth/me)...");
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   -> User ID: ${meRes.data._id || meRes.data.id}`);
        console.log(`   -> Synthetic Phone (Identity): ${meRes.data.synthetic_phone}`);
        const activeIdentity = meRes.data.synthetic_phone;

        console.log("\n3. Fetching Active Plans (/plan/my-plans)...");
        const plansRes = await axios.get(`${API_URL}/plan/my-plans`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`   -> Active Plans Count: ${plansRes.data.length}`);
        plansRes.data.forEach(p => {
            console.log(`      - Plan: ${p.planName} | ID: ${p._id} | Phone: ${p.syntheticPhone}`);
        });

        if (plansRes.data.length === 0) {
            console.error("   CRITICAL: No active plans found. Identity header will fail lookup.");
        }

        console.log(`\n4. Fetching Tasks with Identity: '${activeIdentity}'...`);
        try {
            const taskRes = await axios.get(`${API_URL}/task`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-usa-identity': activeIdentity,
                    'x-usa-key': activeIdentity
                }
            });
            console.log(`   -> Status: ${taskRes.status}`);
            console.log(`   -> Tasks Returned: ${taskRes.data.length}`);
            if (taskRes.data.length > 0) {
                console.log("   -> Sample Task:", JSON.stringify(taskRes.data[0], null, 2));
            } else {
                console.log("   -> Body:", JSON.stringify(taskRes.data, null, 2));
            }
        } catch (e) {
            console.error("   -> Task Fetch Failed:", e.response?.data || e.message);
        }

    } catch (err) {
        console.error("DIAGNOSIS FAILED:", err.response?.data || err.message);
    }
}

diagnose();
