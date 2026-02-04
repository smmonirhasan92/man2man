const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const ReferralService = require('../modules/referral/ReferralService');
const ReferralConfig = require('../modules/referral/ReferralConfig');
require('dotenv').config();

async function runSimulation() {
    console.log(">>> STARTING REFERRAL SIMULATION <<<");

    // Connect DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    try {
        // 1. Create Chain of 11 Users (User 0 to User 10)
        // User 0 is top, User 1 refers to User 0, ..., User 10 refers to User 9.
        const users = [];
        let previousUser = null;

        // Clean up checking
        const prefix = "sim_user_";
        await User.deleteMany({ username: { $regex: prefix } });
        console.log("Cleaned up old simulation users.");

        for (let i = 0; i <= 10; i++) {
            const user = new User({
                fullName: `Sim User ${i}`,
                username: `${prefix}${i}`,
                email: `${prefix}${i}@test.com`,
                phone: `0190000000${i}`,
                password: 'hashedpassword',
                country: 'Bangladesh',
                referredBy: previousUser ? previousUser._id : null
            });
            await user.save();
            users.push(user);
            previousUser = user;
            console.log(`Created ${user.username} (ReferredBy: ${user.referredBy})`);
        }

        const workerUser = users[10]; // The one doing the task

        // 2. Test Type A (Joining)
        // Simulate Logic: user 10 deposits money -> triggers joining bonus
        console.log("\n--- TEST 1: Joining Bonus (Type A) ---");
        // We simulate a deposit of 1000 BDT
        const joiningResult = await ReferralService.distributeIncome(workerUser._id, 1000, 'joining');
        console.log("Joining Result:", joiningResult);

        // Verify Balances (User 0 to 9 should have received money)
        // In our Config, we used the 6.00 model for Type B. 
        // For Type A, we didn't explicitly implement a different "Fixed Amount" logic in the Service yet (it uses the same percentage).
        // If 1000 is passed: 7% = 70. L1 gets 50% of 70 = 35.
        // Let's check a few.

        const upline1 = await User.findById(users[9]._id); // Level 1 referrer
        console.log(`L1 Upline (${upline1.username}) Balance: ${upline1.wallet.main}`);

        const upline10 = await User.findById(users[0]._id); // Level 10 referrer
        console.log(`L10 Upline (${upline10.username}) Balance: ${upline10.wallet.main}`);


        // 3. Test Type B (Task Commission) - Dynamic
        console.log("\n--- TEST 2: High Value Task (Type B - Dynamic) ---");
        // Amount: 6000 (Should trigger 8% tier)
        const taskResult = await ReferralService.distributeIncome(workerUser._id, 6000, 'task_commission');
        console.log("Task Result:", taskResult);

        // 6000 * 8% = 480 deducted.
        // L1 (User 9) should get 50% of 480/totalRatioSum? 
        // Wait, ratio sum is 6.00. 
        // Logic: (2.50 / 6.00) * 480 = 0.4166 * 480 = 200.
        // Let's verify.

        const upline1Refreshed = await User.findById(users[9]._id);
        console.log(`L1 Upline After Task (${upline1Refreshed.username}) Balance: ${upline1Refreshed.wallet.main} (Expected ~35 + 200 = 235)`);

    } catch (err) {
        console.error("Simulation Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

runSimulation();
