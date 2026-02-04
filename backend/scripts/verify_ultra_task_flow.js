const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';
let AUTH_TOKEN = '';
let USA_KEY = '';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
    console.log('STARTING ULTRA-MODERN TASK FLOW VERIFICATION');

    try {
        // 1. Login
        console.log('Logging in as test55...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: '01755555555',
            password: '123456'
        });
        AUTH_TOKEN = loginRes.data.token;
        const user = loginRes.data.user;
        console.log(`Login Success: ${user.name}`);

        // 2. Refresh User to get Key
        console.log('Fetching User Details...');
        const userRes = await axios.get(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        USA_KEY = userRes.data.synthetic_phone || userRes.data.user?.synthetic_phone;
        console.log(`USA KEY: ${USA_KEY}`);

        if (!USA_KEY) {
            console.log('ERROR: No USA Key found on user.');
            process.exit(1);
        }

        // 3. Get Tasks
        console.log('Fetching Available Tasks...');
        const tasksRes = await axios.get(`${BASE_URL}/task`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
        });
        const tasks = tasksRes.data;
        if (tasks.length === 0) {
            console.log('ERROR: No tasks available.');
            process.exit(1);
        }
        console.log(`Found ${tasks.length} tasks.`);

        // 4. Run Cycle
        console.log('STARTING TASK CYCLE (3 LOOPS)...');
        const targetTask = tasks[0];

        for (let i = 1; i <= 3; i++) {
            console.log(`[Task ${i}] Starting...`);

            // A. Start
            await axios.post(`${BASE_URL}/task/start`, { taskId: targetTask._id }, {
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
            });

            // B. Wait
            await sleep(12000);

            // C. Process
            const processRes = await axios.post(`${BASE_URL}/task/process`, { taskId: targetTask._id }, {
                headers: {
                    Authorization: `Bearer ${AUTH_TOKEN}`,
                    'x-usa-key': USA_KEY
                }
            });

            console.log(`[Task ${i}] DONE. New Balance: ${processRes.data.newBalance}`);
        }

        console.log('CYCLE COMPLETE');

    } catch (err) {
        console.log('VERIFICATION FAILED');
        if (err.response) {
            console.log(`Status: ${err.response.status}`);
            console.log(`Data: ${JSON.stringify(err.response.data)}`);
        } else {
            console.log(`Error: ${err.message}`);
        }
        process.exit(1);
    }
}

run();
