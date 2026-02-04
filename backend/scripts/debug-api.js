const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';
const PORT = process.env.PORT || 5000;

async function testAdminAPI() {
    try {
        console.log('--- Starting Admin API Diagnosis ---');

        // 1. Generate a Fresh Token for Admin (ID 1)
        console.log('1. Generating Fresh Admin Token...');
        const payload = {
            user: {
                id: 1,
                role: 'super_admin' // We claim we are super_admin
            }
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        console.log('   Token generated successfully.');

        // 2. Test /api/admin/users Endpoint
        const url = `http://localhost:${PORT}/api/admin/users`;
        console.log(`2. Testing URL: ${url}`);

        const res = await axios.get(url, {
            headers: { 'x-auth-token': token }
        });

        console.log(`3. Response Status: ${res.status} ${res.statusText}`);

        if (Array.isArray(res.data)) {
            console.log(`4. Data Received: ${res.data.length} users found.`);
            if (res.data.length > 0) {
                console.log('   [SUCCESS] User list is populated!');
                console.log('   Sample User:', JSON.stringify(res.data[0], null, 2));
            } else {
                console.log('   [WARNING] User list is empty (but request succeeded).');
            }
        } else {
            console.log('   [ERROR] Response data is not an array:', res.data);
        }

    } catch (err) {
        console.log('--- REQUEST FAILED ---');
        console.log(`Status: ${err.response?.status}`);
        console.log(`Message: ${err.response?.data?.message || err.message}`);
        if (err.response?.data) {
            console.log('Error Details:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testAdminAPI();
