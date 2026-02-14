const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5050/api';

async function run() {
    console.log('VERIFYING DYNAMIC KEY GENERATION (API-DRIVEN)');

    // Generate unique user to bypass DB/Environment mismatches
    const timestamp = Date.now().toString();
    const uniqueSuffix = timestamp.slice(-8);
    const testPhone = 'test55';
    const testPassword = '123456';

    let AUTH_TOKEN = '';

    try {
        // 1. Register User
        console.log(`1. Registering new test user: ${testPhone}...`);
        try {
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                fullName: `Test Dyn ${uniqueSuffix}`,
                primary_phone: testPhone,
                country: 'US',
                password: testPassword
            });
            AUTH_TOKEN = regRes.data.token;
            console.log('   Registration Success. Token acquired.');
        } catch (regErr) {
            if (regErr.response && regErr.response.status === 400) {
                console.log('   User exists, attempting login...');
                const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                    primary_phone: testPhone,
                    password: testPassword
                });
                AUTH_TOKEN = loginRes.data.token;
                console.log('   Login Success.');
            } else {
                throw regErr;
            }
        }

        if (!AUTH_TOKEN) throw new Error("No Auth Token obtained.");

        // 2. Request Dynamic Key
        console.log('2. Requesting Dynamic Key...');
        const keyRes = await axios.post(`${BASE_URL}/task/generate-key`, {}, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });

        const dynamicKey = keyRes.data.key;
        console.log(`   Generated Key: ${dynamicKey}`);

        if (!dynamicKey || !dynamicKey.startsWith('+1')) {
            throw new Error(`Invalid Key Format: ${dynamicKey}`);
        }

        // 3. Verify Persistence
        console.log('3. Verifying Key Persistence via /auth/me ...');
        const meRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });

        // Handle both response structures just in case
        const userData = meRes.data.user || meRes.data;
        const storedKey = userData.synthetic_phone;

        console.log(`   Stored Key in DB: ${storedKey}`);

        if (storedKey === dynamicKey) {
            console.log('✅ PASS: Dynamic Key functionality confirmed.');
        } else {
            console.error('❌ FAIL: Database does not match generated key.');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err.message);
        if (err.response) {
            console.error('   Status:', err.response.status);
            const fs = require('fs');
            fs.writeFileSync('debug_error.log', JSON.stringify(err.response.data, null, 2));
            console.error('   Data written to debug_error.log');
        }
        process.exit(1);
    }
}

run();
