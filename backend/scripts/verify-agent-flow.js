const axios = require('axios');

async function verifyAgentFlow() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            phone: '01985010101',
            password: 'Sir@0101'
        });
        const token = loginRes.data.token;
        console.log('Admin Login:', token ? 'Success' : 'Failed');

        // 2. Create Agent
        const agentData = {
            fullName: 'Test Agent',
            phone: '01711112222',
            password: 'AgentPass123',
            commissionRate: 5.5
        };

        try {
            const createRes = await axios.post('http://localhost:5000/api/admin/agent', agentData, {
                headers: { 'x-auth-token': token }
            });
            console.log('Create Agent Response:', createRes.data.message);
            console.log('Agent Data:', createRes.data.agent.username, createRes.data.agent.role, createRes.data.agent.commissionRate);
        } catch (err) {
            console.error('Create Agent Failed:', err.response?.data?.message || err.message);
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

verifyAgentFlow();
