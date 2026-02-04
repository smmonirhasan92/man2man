const axios = require('axios');

async function trigger() {
    try {
        const seed = Math.floor(Math.random() * 10000);
        const newUser = {
            fullName: `TestUser_${seed}`,
            identifier: `019${seed.toString().padStart(8, '0')}`,
            password: 'password123',
            confirmPassword: 'password123',
            referralCode: ''
        };

        console.log(`1. Registering ${newUser.identifier}...`);

        let token;
        try {
            const regRes = await axios.post('http://localhost:5050/api/auth/register', newUser);
            token = regRes.data.token;
        } catch (e) {
            // Fallback login if exists
            console.log("User exists? Trying login...");
            const loginRes = await axios.post('http://localhost:5050/api/auth/login', {
                identifier: newUser.identifier,
                password: 'password123'
            });
            token = loginRes.data.token;
        }

        console.log("Logged in:", token ? "YES" : "NO");

        // Add balance if needed (Assume free sign up bonus or we will hit Insufficient Balance, which is also a valid test of transaction)
        // If 0 balance, we expect 400 Insufficient. If deadlock, we expect Timeout.
        // Let's assume we need balance. But admin routes are protected.
        // We will test if it DEADLOCKS on Insufficient Balance too (it should not).

        console.log("2. Spinning...");
        const spinRes = await axios.post('http://localhost:5050/api/game/super-ace/spin',
            { betAmount: 10 },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Spin 1 Result:", spinRes.data.gameId);

        console.log("3. Waiting 2s...");
        await new Promise(r => setTimeout(r, 2000));

        console.log("4. Spinning 2 (Deadlock Test)...");
        const spinRes2 = await axios.post('http://localhost:5050/api/game/super-ace/spin',
            { betAmount: 10 },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Spin 2 Result:", spinRes2.data.gameId);

    } catch (e) {
        console.error("TRIGGER FAIL:", e.response?.data || e.message);
    }
}

trigger();
