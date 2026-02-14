const axios = require('axios');
const BASE_URL = 'http://localhost:5050/api';

async function login() {
    try {
        console.log('Attempting login for test55...');
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            primary_phone: 'test55',
            password: '123456'
        });
        console.log('Login Success:', res.data.token ? 'Token Received' : 'No Token');
        console.log('User:', res.data.user);
    } catch (err) {
        console.error('Login Failed:', err);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data));
        }
    }
}

login();
