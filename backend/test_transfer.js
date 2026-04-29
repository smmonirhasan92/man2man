const axios = require('axios');
const login = async () => {
    try {
        const res = await axios.post('http://127.0.0.1:10000/api/auth/login', { identifier: 'testmail@gmail.com', password: 'password123' });
        const token = res.data.token;
        const transferRes = await axios.post('http://127.0.0.1:10000/api/wallet/transfer/main', { amount: 500 }, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Success:', transferRes.data);
    } catch (e) {
        console.log('Error Data:', e.response ? e.response.data : e.message);
    }
};
login();
