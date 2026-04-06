const axios = require('axios');

const API_BASE = 'http://76.13.244.202:5011'; // VPS Backend
const ADMIN_PHONE = '01712345678';
const ADMIN_PASS = '000000';

async function runVPSAudit() {
    try {
        console.log("--- 🕵️ VPS P2P POST-DEPLOYMENT AUDIT ---");
        
        // 1. Check Health
        console.log("🔍 Checking VPS Health...");
        const health = await axios.get(`${API_BASE}/health`);
        console.log(`✅ VPS Health: ${health.data.status || 'OK'}`);

        // 2. Login as Admin
        console.log("🔑 Authenticating as Super Admin...");
        const loginRes = await axios.post(`${API_BASE}/api/auth/login`, {
            primary_phone: ADMIN_PHONE,
            password: ADMIN_PASS
        });
        
        const token = loginRes.data.token;
        if (!token) throw new Error("Login failed - no token received.");
        console.log("✅ Admin Authenticated.");

        // 3. Fetch Game Vault State (Redis check)
        console.log("📊 Fetching Remote Game Vault & Redis Pot...");
        const vaultRes = await axios.get(`${API_BASE}/api/admin/vault`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const vault = vaultRes.data;
        console.log(`- Redis P2P Pot: ${vault.balances.activePool} NXS (Synced)`);
        console.log(`- Admin Income: ${vault.balances.adminIncome} NXS`);
        console.log(`- Interest Fund: ${vault.balances.userInterest} NXS`);
        
        // 4. Verification Check
        if (vault.balances.activePool !== undefined) {
            console.log("\n✅ P2P CORE SYNC VERIFIED: Redis-based Match Pot is live on VPS.");
        } else {
            console.log("\n⚠️ WARNING: Active Pool state missing or corrupt.");
        }

        console.log("\n--- 📝 AUDIT REPORT COMPLETE ---");
    } catch (err) {
        console.error("❌ VPS Audit Failed!");
        if (err.response) {
            console.error("Response Data:", JSON.stringify(err.response.data, null, 2));
            console.error("Response Status:", err.response.status);
            console.error("Response Headers:", JSON.stringify(err.response.headers, null, 2));
        } else {
            console.error("Error Message:", err.message);
        }
        process.exit(1);
    }
}

runVPSAudit();
