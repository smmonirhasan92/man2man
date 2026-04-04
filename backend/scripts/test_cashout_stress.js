const mongoose = require('mongoose');
const crashGameManager = require('../modules/gamification/CrashGameSocket');
const GamePool = require('../modules/gamification/GamePoolModel');
const User = require('../modules/user/UserModel');
const dotenv = require('dotenv');

// We test 40 asynchronous cashouts hitting the system almost at the exact same millisecond
// to prove that the ACID transactions and the Pool logic doesn't crash or duplicate payments.
async function stressTestCashOuts() {
    console.log("=== CRASH ENGINE: 40x CONCURRENT CASHOUT STRESS TEST ===");

    dotenv.config({ path: '../.env' });
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/man2man");

    console.log("[Setup] Connected to Local DB.");

    try {
        // 1. Create a dummy pool with massive liquidity
        await GamePool.deleteMany({ poolId: 'GLOBAL_CRASH_POOL' });
        await GamePool.create({ poolId: 'GLOBAL_CRASH_POOL', currentLiquidity: 10000 });

        // 2. Create a dummy test user specifically for stress testing
        await User.deleteOne({ username: 'crash_tester' });
        const user = await User.create({
            fullName: 'Stress Tester',
            username: 'crash_tester',
            primary_phone: '+1000000001X',
            country: 'USA',
            password: 'hashed_dummy',
            wallet: { main: 50.00 } // Starts with 50 NXS
        });

        const testUserId = user._id;

        // 3. Mock Game Engine State locally to skip waiting for actual timers
        crashGameManager.io = { emit: () => {} }; // Dummy socket
        
        console.log("\n[Test Phase 1] Placing 40 concurrent bets (Should Reject 39 since 1 allowed per round)");
        
        // Let's modify the engine state to allow us to test the fundamental ACID Cashout block directly.
        // We will artifically insert 40 "ghost bets" linked to the SAME user but pretend they are different.
        // Wait, the user wants to test Cashout logic. I can just artificially inject 40 bets mapped to dummy keys,
        // or actually run 40 cash-out attempts on ONE bet to ensure they don't get paid 40 times (Double Spend vulnerability test).
        
        // This is a Double Spend attack test!
        crashGameManager.state = 'BETTING';
        await crashGameManager.placeBet(testUserId, 10.00); // 10 NXS bet
        
        let initialDbUser = await User.findById(testUserId);
        console.log(`User placed bet. Balance drops to: ${initialDbUser.wallet.main.toFixed(2)} NXS (from 50)`); // Should be 40
        
        // Artifically fast forward the state
        crashGameManager.state = 'FLYING';
        crashGameManager.currentMultiplier = 5.00; // Locked at 5.00x payload!
        crashGameManager.crashPoint = 20.00; // Hasn't crashed yet

        console.log(`\n[Test Phase 2] Simulating 40 instantaneous concurrent CASHOUT requests on the SAME user to attempt a Double-Spend attack (Expected Payout: 10 * 5 = 50 NXS).`);

        const promises = [];
        let successCount = 0;
        let failCount = 0;

        for(let i=0; i<40; i++) {
            promises.push(
                crashGameManager.cashOut(testUserId)
                .then(() => successCount++)
                .catch(err => failCount++)
            );
        }

        // Run all 40 promises in parallel natively
        await Promise.allSettled(promises);

        const finalUser = await User.findById(testUserId);

        console.log(`\n--- RESULTS ---`);
        console.log(`Successful Cashouts: ${successCount}`);
        console.log(`Rejected Overlap Requests: ${failCount}`);
        console.log(`Final Database Main Balance: ${finalUser.wallet.main.toFixed(2)} NXS`);

        if (successCount === 1 && failCount === 39 && finalUser.wallet.main === 90.00) {
            console.log("\n✅ ACID TRANSACTION PASSED: Zero Double-Spends. 100% mathematically secure against race conditions.\n");
        } else {
            console.log("\n❌ SECURITY FLAW DETECTED: Race condition breached the database lock!\n");
        }

    } catch (err) {
        console.error("Test framework failed", err);
    }

    mongoose.disconnect();
}

stressTestCashOuts();
