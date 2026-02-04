const axios = require('axios');

async function verifyAdminAPI() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            phone: '01985010101',
            password: 'Sir@0101'
        });
        const token = loginRes.data.token;
        console.log('Login Successful. Token:', token ? 'Received' : 'Missing');

        // 2. Fetch Pending Recharges (Admin Route)
        try {
            const res = await axios.get('http://localhost:5000/api/admin/recharges', {
                headers: { 'x-auth-token': token }
            });
            console.log('API Response Status:', res.status);
            console.log('API Response Data:', JSON.stringify(res.data, null, 2));
        } catch (adminErr) {
            console.error('Admin API Error:', adminErr.response ? adminErr.response.data : adminErr.message);
        }

    } catch (err) {
        console.error('Login Failed:', err.response ? err.response.data : err.message);
    }
}

verifyAdminAPI();
