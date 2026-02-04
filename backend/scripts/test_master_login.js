const axios = require('axios');

async function testMasterLogin() {
    try {
        console.log('Testing Master Key Login (01700000000)...');
        // Sending ANY password, should work
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            phone: '01700000000',
            password: 'WRONG_PASSWORD_BUT_SHOULD_WORK'
        });

        console.log('✅ Login Success!');
        console.log('User:', response.data.user.username);
        console.log('Role:', response.data.user.role);

        if (response.data.user.role === 'super_admin') {
            console.log('🎉 Verified: Super Admin Access Granted.');
        } else {
            console.log('⚠️ Warning: Role is not super_admin');
        }

    } catch (err) {
        console.error('❌ Login Failed:', err.response ? err.response.data : err.message);
    }
}

testMasterLogin();
