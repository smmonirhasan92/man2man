const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

async function stressTest() {
    console.log('🔥 STARTING STRESS TEST: 50 Concurrent Task Completions');

    // 1. Login as User
    let token;
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            phone: '01700000000',
            password: 'any' // Master Key
        });
        token = loginRes.data.token;
        console.log('✅ Logged in for Stress Test');
    } catch (err) {
        console.error('Login Failed', err.message);
        return;
    }

    // 2. Mock Task ID (Use a real one ideally, or just assume ID 1 logic)
    // The system uses ad IDs usually. We'll use a dummy ID.
    const taskId = 'STRESS_TEST_TASK_' + Date.now();

    // 3. Launch 50 Requests Concurrently
    const requests = [];
    for (let i = 0; i < 50; i++) {
        requests.push(
            axios.post(`${API_URL}/task/submit`, {
                adId: taskId, // Same ID to test duplicate prevention? 
                // Actually, duplicate prevention usually bans doing the SAME task ID twice.
                // But daily limit is distinct.
                // If we use different IDs, we test wallet concurrency.
                // If we use SAME ID, we test idempotency.
                // improved: 25 same ID, 25 different.
                adId: i < 25 ? taskId : `TASK_${i}`,
                rating: 5,
                review: "Stress Test"
            }, {
                headers: { 'x-auth-token': token }
            }).catch(e => ({ status: e.response?.status, data: e.response?.data }))
        );
    }

    const results = await Promise.all(requests);

    // 4. Analyze Results
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    results.forEach(res => {
        if (res.status === 200) successCount++;
        else if (res.status === 400 && res.data?.message?.includes('already')) duplicateCount++; // "Already completed"
        else failCount++;
    });

    console.log('------------------------------------------------');
    console.log(`📊 Stress Test Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️ Prevented Duplicates: ${duplicateCount}`);
    console.log(`❌ Failed (Other): ${failCount}`);

    if (successCount > 1 && duplicateCount > 0) {
        console.log('✅ Concurrency Check Passed: System prevented unlimited exploitation.');
    } else if (successCount === 50) {
        console.log('⚠️ WARNING: 50 Successes? Check if daily limit was ignored or user has high limit.');
    }

    console.log('------------------------------------------------');
}

stressTest();
