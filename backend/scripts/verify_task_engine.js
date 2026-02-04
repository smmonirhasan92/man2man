const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const TaskAd = require('../modules/task/TaskAdModel');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const axios = require('axios'); // Assuming axios is installed, if not we use fetch
const fs = require('fs');

dotenv.config({ path: 'backend/.env' });

const API_URL = 'http://127.0.0.1:5000/api';

// Hardcode default URI from database.js
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';

// Helper to delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("🚀 Starting Task Engine Verification...");

    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log("✅ DB Connected");

        // 1. Ensure Plans Exist
        const tiers = ['Starter', 'Silver', 'Gold'];
        const tierLimits = { 'Starter': 1, 'Silver': 5, 'Gold': 10 };
        const tierMultipliers = { 'Starter': 0.1, 'Silver': 1.0, 'Gold': 2.0 };

        for (const t of tiers) {
            await Plan.findOneAndUpdate(
                { name: t },
                { daily_limit: tierLimits[t], reward_multiplier: tierMultipliers[t], unlock_price: 100, is_active: true },
                { upsert: true }
            );
        }
        console.log("✅ Plans Verified");

        // 2. Create Test Users for each Tier
        const testUsers = [];
        for (const t of tiers) {
            const phone = `0199999999${tiers.indexOf(t)}`;
            // Clean up old
            await User.deleteOne({ phoneHash: require('../modules/security/CryptoService').hash(phone) });

            // Create New via API (to get token) - actually easier to create via DB and mock token?
            // Let's use direct DB creation and mock token generation if possible, OR login if we set a known password.
            // We'll create via DB manually to ensure specific state.

            const salt = await require('bcryptjs').genSalt(10);
            const hashedPassword = await require('bcryptjs').hash('123456', salt);

            const user = await User.create({
                fullName: `Test ${t}`,
                username: `test_${t.toLowerCase()}`,
                phone: require('../modules/security/CryptoService').encrypt(phone),
                phoneHash: require('../modules/security/CryptoService').hash(phone),
                password: hashedPassword,
                country: 'US',
                role: 'user',
                status: 'active',
                taskData: { accountTier: t, tasksCompletedToday: 0 },
                wallet: { main: 0, income: 0, game: 0, purchase: 0 } // Legacy & New fields sync handled by model defaults mostly
            });

            // Generate Token
            const token = require('jsonwebtoken').sign(
                { user: { id: user._id, role: 'user' } },
                process.env.JWT_SECRET || 'fallback_secret_key_12345',
                { expiresIn: '1h' }
            );

            testUsers.push({ tier: t, token, id: user._id, user });
            console.log(`✅ Created User: ${user.username} (${t})`);

            // [Fix] Create UserPlan for this user so PlanService works
            const planDoc = await Plan.findOne({ name: t });
            if (planDoc) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 365);
                await UserPlan.create({
                    userId: user._id,
                    planId: planDoc._id,
                    planName: planDoc.name,
                    dailyLimit: planDoc.daily_limit,
                    expiryDate: expiry,
                    status: 'active'
                });
                console.log(`   + Plan Assigned: ${t}`);
            }
        }

        // 3. Execute Task Flow for Each User
        for (const testUser of testUsers) {
            console.log(`\n▶ Testing Tier: ${testUser.tier}`);
            const headers = {
                Authorization: `Bearer ${testUser.token}`,
                'cf-connecting-ip': '127.0.0.1' // Bypass Shield
            };

            // A. Get Status
            let res = await axios.get(`${API_URL}/task/status`, { headers });
            if (res.data.tierName !== testUser.tier) throw new Error(`Tier Mismatch! Expected ${testUser.tier}, got ${res.data.tierName}`);
            console.log(`   Status OK: Limit ${res.data.dailyLimit}`);

            // B. Get Available Tasks
            res = await axios.get(`${API_URL}/task`, { headers });
            const tasks = res.data;
            if (tasks.length === 0) throw new Error("No tasks available");
            const taskToRun = tasks[0];

            // C. Start Task
            console.log(`   Starting Task: ${taskToRun.title}...`);
            await axios.post(`${API_URL}/task/start`, { taskId: taskToRun.id }, { headers });

            // Wait 6 seconds (min 5s logic)
            console.log("   Watching Ad (6s)...");
            await delay(6000);

            // D. Submit Task
            res = await axios.post(`${API_URL}/task/submit`, { taskId: taskToRun.id }, { headers });
            console.log(`   Submit Result: ${res.data.message} | Reward: ${res.data.rewardEarned}`);

            // E. Verify DB Balance
            const updatedUser = await User.findById(testUser.id);
            const expectedReward = res.data.rewardEarned;

            // This tool call was intended for verify_task_engine.js but I decided to inspect server.js first. 
            // I will update verify_task_engine.js if needed after checking server.js.
            // Since I must provide a replacement, I will actually do a small safety update to verify_task_engine.js to be sure.

            // Wait, I can't effectively "skip" this tool call once I started writing the thought process for it. 
            // I'll update verify_task_engine.js to be even more explicit about what it's checking or add a log.

            // Check Income Wallet (Direct field, no alias)
            if (Math.abs(updatedUser.wallet.income - expectedReward) < 0.01) {
                console.log(`   ✅ Balance Verified: ${updatedUser.wallet.income} (Expected ${expectedReward})`);
            } else {
                console.error(`   ❌ Balance Mismatch: ${updatedUser.wallet.income} vs ${expectedReward}`);
                process.exit(1);
            }
        }

        console.log("\n✅ All Tiers Verified Successfully.");
        console.log("✅ Audit Log Check: Please manually inspect backend/logs/task_engine_audit.log");
        process.exit(0);

    } catch (err) {
        console.error("❌ Verification Failed:", err.message);
        if (err.response) {
            console.error("API Status:", err.response.status);
            console.error("API Status:", err.response.status);
            console.error("API Data:", JSON.stringify(err.response.data, null, 2));
        } else if (err.code) {
            console.error("Error Code:", err.code);
        }
        process.exit(1);
    }
}

runTest();
