const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyReferralAPI() {
    try {
        console.log('🔄 Testing Referral API...');

        // 1. Login as Super Admin (Who has referrals ideally, or we test empty state)
        // Super Admin (01700000000)
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01700000000',
            password: 'any' // Master Key
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in as Super Admin');

        // 2. Fetch Dashboard Data (Level 1)
        console.log('📊 Fetching L1 Data...');
        const res = await axios.get(`${API_URL}/referral/dashboard-data?level=1`, {
            headers: { 'x-auth-token': token }
        });

        const data = res.data;
        if (data.stats && data.network !== undefined) {
            console.log('✅ API Response Valid');
            console.log(`   - Earnings: ${data.stats.totalEarnings}`);
            console.log(`   - Network Size (L1): ${data.network.length}`);
            console.log(`   - Referral Code: ${data.referralCode}`);
        } else {
            console.log('❌ Invalid Response Structure', Object.keys(data));
        }

    } catch (err) {
        console.error('❌ API Test Failed:', err.response ? err.response.data : err.message);
    }
}

verifyReferralAPI();
