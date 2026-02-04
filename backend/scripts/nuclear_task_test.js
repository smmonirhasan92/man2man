const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const CryptoService = require('../modules/security/CryptoService');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: 'backend/.env' });

const API_URL = 'http://127.0.0.1:5000/api';
const LOG_FILE = path.join(__dirname, '../logs/modular_audit.log');

// Ensure log dir
if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

// Helper to delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function logAudit(msg) {
    const entry = `[${new Date().toISOString()}] [NUCLEAR_TEST] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, entry);
    console.log(msg);
}

async function runNuclearTest() {
    logAudit("🚀 INITIALIZING NUCLEAR STRESS TEST (100 CYCLES)...");

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true', { family: 4 });
        logAudit("✅ DB Connected");

        // 1. Setup 'Gold' Plan (High limit)
        await Plan.findOneAndUpdate(
            { name: 'NuclearGold' },
            { daily_limit: 200, reward_multiplier: 1.0, unlock_price: 0, is_active: true },
            { upsert: true }
        );

        // 2. Create Nuclear User
        const phone = '01888888888';
        await User.deleteOne({ phoneHash: CryptoService.hash(phone) });

        const user = await User.create({
            fullName: 'Nuclear Tester',
            username: 'nuclear_test',
            phone: CryptoService.encrypt(phone),
            phoneHash: CryptoService.hash(phone),
            password: 'hashed_dummy',
            country: 'US',
            role: 'user',
            status: 'active',
            taskData: { accountTier: 'NuclearGold', tasksCompletedToday: 0 },
            wallet: { income: 0, main: 0, game: 0, purchase: 0 }
        });

        // 3. Generate Token
        const token = require('jsonwebtoken').sign(
            { user: { id: user._id, role: 'user' } },
            process.env.JWT_SECRET || 'fallback_secret_key_12345',
            { expiresIn: '1h' }
        );

        const headers = {
            Authorization: `Bearer ${token}`,
            'cf-connecting-ip': '127.0.0.1'
        };

        // 4. Loop 100 Times
        let successCount = 0;
        const cycles = 100;

        for (let i = 1; i <= cycles; i++) {
            // A. Get Status
            // logAudit(`[Cycle ${i}] Checking Status...`);
            // const statusRes = await axios.get(`${API_URL}/task/status`, { headers });

            // B. Start Task
            const taskId = 'sys_nuclear_' + i;
            await axios.post(`${API_URL}/task/start`, { taskId }, { headers });

            // C. Wait 10s (Simulated - actually backends minimal check is 5s, we can do 6s speedrun for test speed, or 10s for strict accuracy)
            // Use 6s for speed, checking "10s logic" applies to frontend mostly. Backend check is min 5s.
            await delay(6000);

            // D. Submit
            const subRes = await axios.post(`${API_URL}/task/submit`, { taskId }, { headers });

            if (subRes.data.success) {
                successCount++;
                if (i % 10 === 0) logAudit(`✅ Cycle ${i} Completed. Balance: ${subRes.data.newBalance}`);
            } else {
                logAudit(`❌ Cycle ${i} FAILED: ${subRes.data.message}`);
                break;
            }
        }

        // 5. Final Balance Check
        const finalUser = await User.findById(user._id);
        const expectedBalance = successCount * 5.0; // Base 5.0 * 1.0

        if (Math.abs(finalUser.wallet.income - expectedBalance) < 0.1) {
            logAudit(`🏆 NUCLEAR TEST PASSED. ${successCount}/${cycles} Tasks. Final Balance: ${finalUser.wallet.income}`);
        } else {
            logAudit(`💀 BALANCE MISMATCH. Expected ${expectedBalance}, Got ${finalUser.wallet.income}`);
            process.exit(1);
        }

        process.exit(0);

    } catch (err) {
        logAudit(`💥 FATAL ERROR: ${err.message}`);
        if (err.response) logAudit(`API Response: ${JSON.stringify(err.response.data)}`);
        process.exit(1);
    }
}

runNuclearTest();
