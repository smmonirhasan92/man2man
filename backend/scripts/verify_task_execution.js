const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function run() {
    console.log('VERIFYING TASK EXECUTION FLOW');

    // 1. Setup User & Key (Reuse strict flow logic if needed, or just login test55)
    // For speed, let's register a new user to ensure clean state
    const timestamp = Date.now().toString();
    const uniqueSuffix = timestamp.slice(-6);
    const testPhone = `019${uniqueSuffix}`; // Different prefix
    const testPassword = '123456';
    let AUTH_TOKEN = '';
    let USER_ID = '';
    let TASK_ID = '';
    let USA_KEY = '';

    try {
        // REGISTER
        console.log(`1. Registering ${testPhone}...`);
        const regRes = await axios.post(`${BASE_URL}/auth/register`, {
            fullName: `Task Tester ${uniqueSuffix}`,
            primary_phone: testPhone,
            country: 'US',
            password: testPassword
        });
        AUTH_TOKEN = regRes.data.token;
        USER_ID = regRes.data.user.id;
        console.log('   Success.');

        // BUY PLAN (Free Plan usually doesn't allow tasks? Or maybe it does. Let's buy a valid plan to be sure)
        // Actually, let's just use the free plan details if they exist, or check available plans
        // For now, assume default user might need a plan upgrade or manual fund.
        // Let's fund and buy 'Standard Plan' (1300) to match user case.

        // FUND
        await axios.post(`${BASE_URL}/transaction/add-money`, {
            amount: 2000,
            method: 'bkash',
            transactionId: `FUND${timestamp}`,
            recipientDetails: 'System'
        }, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
        console.log('   Funded 2000.');

        // BUY PLAN (Need Plan ID... let's fetch plans)
        const plansRes = await axios.get(`${BASE_URL}/plan`);
        const standardPlan = plansRes.data.plans.find(p => p.unlock_price === 1300) || plansRes.data.plans[0];

        await axios.post(`${BASE_URL}/plan/purchase/${standardPlan._id || standardPlan.id}`, {}, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log('   Plan Purchased.');


        // GENERATE KEY
        const keyRes = await axios.post(`${BASE_URL}/task/generate-key`, {}, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        USA_KEY = keyRes.data.key;
        console.log(`   Key Generated: ${USA_KEY}`);


        // GET TASKS
        const tasksRes = await axios.get(`${BASE_URL}/task`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        if (tasksRes.data.length === 0) throw new Error('No tasks available');
        TASK_ID = tasksRes.data[0]._id || tasksRes.data[0].id;
        console.log(`   Task Found: ${TASK_ID}`);


        // START TASK
        console.log('2. Starting Task...');
        await axios.post(`${BASE_URL}/task/start`, { taskId: TASK_ID }, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        console.log('   Task Started (Session Active).');

        // WAIT (Simulate duration)
        console.log('   Waiting 6 seconds...');
        await new Promise(r => setTimeout(r, 6000));

        // COMPLETE TASK (PROCESS)
        console.log('3. Completing Task...');
        const compRes = await axios.post(`${BASE_URL}/task/process`, { taskId: TASK_ID }, {
            headers: {
                Authorization: `Bearer ${AUTH_TOKEN}`,
                'x-usa-key': USA_KEY
            }
        });
        console.log('   ✅ Task Completed:', compRes.data.message);
        console.log('   New Balance:', compRes.data.newBalance);


    } catch (err) {
        console.error('CRITICAL FAILURE:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
        process.exit(1);
    }
}

run();
