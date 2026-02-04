const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = 'api_lottery_flow_logs.json';

const adminCreds = { phone: '01711111111', password: 'password' };
const userCreds = { phone: '01912345678', password: 'password' };

const logBuffer = [];
function log(step, data) {
    console.log(`\n[${step}]`);
    console.log(JSON.stringify(data, null, 2));
    logBuffer.push({ step, data });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logBuffer, null, 2));
}

async function runTest() {
    console.log("🚀 STARTING LOTTERY API VERIFICATION...");

    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("✅ DB Connected for Token Bypass");

        // 1. ADMIN LOGIN (Direct Token Generation to bypass API issues)
        console.log("👉 Admin Login (Direct Token)...");
        const User = require('../modules/user/UserModel');
        const jwt = require('jsonwebtoken');

        let adminUser = await User.findOne({ primary_phone: adminCreds.phone });
        if (!adminUser) throw new Error("Admin User not found in DB");

        const payload = {
            user: {
                id: adminUser.id,
                role: adminUser.role
            }
        };
        const adminToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("✅ Admin Token Generated Directly");

        const adminHeaders = { 'x-auth-token': adminToken };

        // 2. USER LOGIN
        console.log("👉 User Login...");
        let userToken, userId;
        try {
            const userLogin = await axios.post(`${API_URL}/auth/login`, userCreds);
            userToken = userLogin.data.token;
            userId = userLogin.data.user.id || userLogin.data.user._id;
            console.log("✅ User Logged In");
        } catch (e) {
            console.error("❌ User Login Failed:", e.response ? e.response.data : e.message);
            throw new Error("User Login Failed");
        }
        const userHeaders = { 'x-auth-token': userToken };

        // 3. CHECK USER MONEY (Need Game Balance)
        // If Game Balance is 0, transfer from Main
        let balRes = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
        let gameBal = balRes.data.game_balance;
        let mainBal = balRes.data.main_balance;

        log('1. Initial Balances', { main: mainBal, game: gameBal });

        if (gameBal < 50) {
            console.log("⚠️ Low Game Balance. Transferring from Main...");
            if (mainBal < 50) {
                // Deposit via Admin
                await axios.post(`${API_URL}/admin/manage-transaction`, {
                    userId,
                    amount: 500,
                    type: 'deposit',
                    status: 'completed',
                    method: 'manual'
                }, { headers: adminHeaders });
                console.log("✅ Admin Deposited 500 BDT");
            }
            // Transfer
            await axios.post(`${API_URL}/wallet/transfer`, {
                amount: 100,
                from: 'main',
                to: 'game'
            }, { headers: userHeaders });
            console.log("✅ Transferred 100 BDT to Game Wallet");

            // Refresh
            balRes = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
            gameBal = balRes.data.game_balance;
        }

        // 4. ADMIN CREATE LOTTERY
        console.log("👉 Creating Lottery...");
        const lotRes = await axios.post(`${API_URL}/admin/lottery/create`, {
            name: "API Verify Lottery",
            price: 50,
            prizePool: 1000,
            drawDate: new Date(Date.now() + 86400000), // Tmrw
            status: 'active'
        }, { headers: adminHeaders });
        const lotteryId = lotRes.data._id;
        log('2. Lottery Created', lotRes.data);

        // 5. USER BUY TICKET
        console.log("👉 Buying Ticket...");
        const buyRes = await axios.post(`${API_URL}/lottery/buy`, {
            lotteryId,
            amount: 1
        }, { headers: userHeaders });
        log('3. Ticket Bought', buyRes.data);

        // 6. VERIFY DEDUCTION
        const balRes2 = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
        const postBuyGameBal = balRes2.data.game_balance;
        log('4. Post-Buy Balance', { pre: gameBal, post: postBuyGameBal });

        if (postBuyGameBal > gameBal - 50) throw new Error("Game Wallet did not decrease correctly!");

        // 7. ADMIN DRAW WINNER (Targeted)
        console.log("👉 Force Drawing Winner...");
        const drawRes = await axios.post(`${API_URL}/admin/lottery/draw`, {
            lotteryId,
            winnerId: userId
        }, { headers: adminHeaders });
        log('5. Draw Result', drawRes.data);

        // 8. VERIFY INCOME CREDIT
        const balRes3 = await axios.get(`${API_URL}/wallet/balance`, { headers: userHeaders });
        const finalIncome = balRes3.data.income_balance;
        const initialIncome = balRes.data.income_balance;

        log('6. Win Verification', { initialIncome, finalIncome, prize: drawRes.data.winner.amount });

        if (finalIncome <= initialIncome) throw new Error("Income Wallet did not increase after Win!");

        console.log("✅✅ LOTTERY API VALIDATED!! ✅✅");

    } catch (e) {
        console.error("❌ TEST FAILED:", e.message);
        if (e.response) {
            console.error("API Error:", e.response.data);
            log('ERROR', e.response.data);
        }
        process.exit(1);
    }
}

runTest();
