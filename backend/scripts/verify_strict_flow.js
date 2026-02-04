const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function run() {
    console.log('VERIFYING STRICT FLOW: Deposit -> Plan -> Key');

    // 1. Setup User
    const timestamp = Date.now().toString();
    const uniqueSuffix = timestamp.slice(-6);
    const testPhone = `018${uniqueSuffix}`;
    const testPassword = '123456';
    let AUTH_TOKEN = '';
    let USER_ID = '';

    try {
        // REGISTER
        console.log(`1. Registering ${testPhone}...`);
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            fullName: `Strict User ${uniqueSuffix}`,
            primary_phone: testPhone,
            country: 'US',
            password: testPassword
        });
        AUTH_TOKEN = regRes.data.token;
        USER_ID = regRes.data.user.id;
        console.log('   Success.');

        // 2. Add Money (Trigger 500 check)
        console.log('2. Adding Money (Deposit)...');
        const trxId = `TXN${timestamp}`;
        try {
            const depRes = await axios.post(`${BASE_URL}/transaction/add-money`, {
                amount: 500,
                method: 'bkash',
                transactionId: trxId,
                recipientDetails: '01700000000'
            }, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });
            console.log('   Deposit Submitted:', depRes.data.message);
        } catch (depErr) {
            console.error('   ❌ DEPOSIT FAILED:', depErr.response?.status, depErr.response?.data);
            throw new Error('Deposit Failed');
        }

        // 3. Generate Key check
        console.log('3. Generating Dynamic Key...');
        try {
            const keyRes = await axios.post(`${BASE_URL}/task/generate-key`, {}, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });
            console.log('   Key Generated:', keyRes.data.key);

            // 4. Verify Identity
            const meRes = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });
            const storedKey = meRes.data.user ? meRes.data.user.synthetic_phone : meRes.data.synthetic_phone;

            if (storedKey === keyRes.data.key) {
                console.log('   ✅ Key Stored in DB Matches.');
            } else {
                console.error('   ❌ Key Mismatch in DB:', storedKey);
            }

        } catch (err) {
            console.error('   ❌ KEY GEN FAILED:', err.response?.status, err.response?.data);
        }

    } catch (err) {
        console.error('CRITICAL FAILURE:', err.message);
        process.exit(1);
    }
}

run();
