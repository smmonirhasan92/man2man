const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function run() {
    console.log('VERIFYING ULTRA TIMER CLAIM FLOW');

    // 1. Setup User & Key 
    const timestamp = Date.now().toString();
    const uniqueSuffix = timestamp.slice(-6);
    const testPhone = `015${uniqueSuffix}`; // 015 Prefix
    const testPassword = '123456';
    let AUTH_TOKEN = '';
    let USER_ID = '';
    let USA_KEY = '';

    try {
        // LOGIN (test55)
        console.log(`1. Logging in test55...`);
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                identifier: '01512345678', // Using a known or created user
                password: 'password123'
            });
            AUTH_TOKEN = loginRes.data.token;
            USER_ID = loginRes.data.user.id;
            console.log('   Login Success.');
        } catch (e) {
            // Fallback to fresh user
            console.log('   Login failed, trying Register...');
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                fullName: `Timer Tester ${uniqueSuffix}`,
                primary_phone: testPhone,
                country: 'US',
                password: testPassword
            });
            AUTH_TOKEN = regRes.data.token;
            USER_ID = regRes.data.user.id;
            console.log('   Register Success.');
        }

        if (!AUTH_TOKEN) throw new Error("Failed to get Auth Token");

        // FUND & BUY PLAN (Standard 1300)
        console.log('2. Provisioning Plan...');
        try {
            await axios.post(`${BASE_URL}/transaction/add-money`, {
                amount: 2000,
                method: 'bkash',
                transactionId: `FUND${timestamp}`,
                recipientDetails: 'System'
            }, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });

            const plansRes = await axios.get(`${BASE_URL}/plan`);
            const standardPlan = plansRes.data.plans.find(p => p.unlock_price === 1300) || plansRes.data.plans[0];

            await axios.post(`${BASE_URL}/plan/purchase/${standardPlan._id || standardPlan.id}`, {}, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });
            console.log('   Plan Active.');
        } catch (err) {
            console.log('   Provisioning note:', err.response?.data?.message || err.message);
        }

        // GENERATE KEY
        console.log('3. Generating Key...');
        const keyRes = await axios.post(`${BASE_URL}/task/generate-key`, {}, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        USA_KEY = keyRes.data.key;
        console.log(`   Key: ${USA_KEY}`);


        // GET TASKS
        console.log('4. Fetching Tasks...');
        const tasksRes = await axios.get(`${BASE_URL}/task`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        const tasks = tasksRes.data;
        if (tasks.length === 0) throw new Error('No tasks found (Seed failed?)');
        console.log(`   Found ${tasks.length} tasks.`);


        // CLAIM LOOP (3 Tasks)
        console.log('5. Running Claim Loop (3 Tasks)...');
        for (let i = 0; i < 3; i++) {
            const task = tasks[i];
            console.log(`   [Task ${i + 1}] Claiming...`);

            // Wait 2s
            await new Promise(r => setTimeout(r, 2000));

            const claimRes = await axios.post(`${BASE_URL}/task/claim`, { taskId: task._id || task.id }, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    'x-usa-key': USA_KEY
                }
            });
            console.log(`   ✅ Claimed! New Balance: ${claimRes.data.newBalance}`);
        }

        console.log('ULTRA FLOW VERIFIED SUCCESSFULLY.');

    } catch (err) {
        console.error('CRITICAL FAILURE:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
        process.exit(1);
    }
}

run();
