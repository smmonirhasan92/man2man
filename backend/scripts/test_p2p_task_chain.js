const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const ReferralService = require('../modules/referral/ReferralService');
require('dotenv').config();

async function simulateP2PTask() {
    try {
        const dotenv = require('dotenv');
        dotenv.config({ path: __dirname + '/../.env' });

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Database connected for Simulation.");

        // Clean up old test users
        await User.deleteMany({ username: { $regex: /^test_p2p_/ } });
        console.log("Cleaned up old test users.");

        // 1. Create 50 Users in a single referral chain
        const users = [];
        let previousCode = null;

        for (let i = 1; i <= 50; i++) {
            const username = `test_p2p_${i}`;
            const refCode = `REF_P2P_${i}`;

            const user = new User({
                fullName: `Test P2P User ${i}`,
                username: username,
                primary_phone: `+88017000000${i < 10 ? '0' + i : i}`,
                password: 'password123',
                transactionPin: '1234',
                status: 'active',
                isReferralBonusPaid: false,
                referralCount: 0,
                role: 'user',
                country: 'Global',
                referralCode: refCode,
                referredBy: previousCode, // Link to the previous user generated
                wallet: { main: 0, income: 0 }
            });

            await user.save();
            users.push(user);
            previousCode = refCode; // Next user will use this code
        }

        console.log(`Successfully created a referral chain of exactly ${users.length} users.`);

        // 2. Simulate User 50 doing a task for $100.
        // We will deduct 5% ($5) and distribute it up the chain.
        const earner = users[49]; // Index 49 is User 50
        const taskRewardAmount = 100.00;

        console.log(`\n--- SIMULATING TASK COMPLETION ---`);
        console.log(`User [${earner.username}] completed a task worth $${taskRewardAmount}.`);
        console.log(`The system will deduct 5% and distribute it to their 5 uplines.`);

        // --- THE PROPOSED MATH ---
        const DEDUCTION_PERCENT = 5.0; // Total 5% pool
        const systemDeductionAmount = (taskRewardAmount * DEDUCTION_PERCENT) / 100; // $5.00
        const earnerNetIncome = taskRewardAmount - systemDeductionAmount; // $95.00

        console.log(`\n> Earner Receives (95%): $${earnerNetIncome.toFixed(2)}`);
        console.log(`> Deducted for P2P Upline Split (5%): $${systemDeductionAmount.toFixed(2)}`);

        // 3. Update the earner's wallet
        earner.wallet.income += earnerNetIncome;
        await earner.save();

        // 4. Distribute the deducted amount using the ReferralService logic
        // We will use the existing ReferralService.distributeIncome method which is already wired 
        // to handle arbitrary amounts and split them according to PLAN_COMMISSION_RATES (2%, 1%, 1%, 0.5%, 0.5%).
        // WAIT: distributeIncome takes the *Total Amount* and calculates 5% stringently inside it!
        // To make it split a specific pool (the $5), we tell it the ORIGINAL amount ($100), and it will automatically
        // extract the 2%, 1%, 1% from $100. 

        const result = await ReferralService.distributeIncome(earner.referredBy, taskRewardAmount, 'p2p_task_commission');

        console.log(`\n--- UPLINE DISTRIBUTION RESULTS ---`);
        console.log(`Total Distributed to Uplines: $${result.distributed.toFixed(2)}`);

        // Verify the 5 levels above User 50
        for (let i = 48; i >= 44; i--) {
            const uplineUser = await User.findById(users[i]._id);
            console.log(`User [${uplineUser.username}] (Level ${49 - i} Upline): Received $${uplineUser.wallet.income.toFixed(2)}`);
        }

        // Verify User 44 (Level 6) got nothing
        const user44 = await User.findById(users[43]._id);
        console.log(`User [${user44.username}] (Level 6 Upline - Should be 0): Received $${user44.wallet.income.toFixed(2)}`);

        console.log(`\n--- LIABILITY CHECK ---`);
        console.log(`Total System Input: $${taskRewardAmount.toFixed(2)}`);
        console.log(`Total Paid to Earner: $${earnerNetIncome.toFixed(2)}`);
        console.log(`Total Paid to Uplines: $${result.distributed.toFixed(2)}`);
        console.log(`System Liability (Input - Paid): $${(taskRewardAmount - (earnerNetIncome + result.distributed)).toFixed(2)}`);

        if ((taskRewardAmount - (earnerNetIncome + result.distributed)) === 0) {
            console.log(`\n✅ ZERO LIABILITY CONFIRMED. Peer-to-Peer Math is Perfect!`);
        } else {
            console.log(`\n❌ ERROR: Math Mismatch!`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

simulateP2PTask();
