const axios = require('axios');

async function test() {
    try {
        console.log('Testing Register on Port 5001...');
        const res = await axios.post('http://localhost:5001/api/auth/register', {
            fullName: 'Debug Tester',
            primary_phone: '01999999999',
            password: '123'
        });
        console.log('Success:', res.status, res.data);
    } catch (err) {
        console.log('Error:', err.response?.status, err.response?.data);
    }
}

test();
