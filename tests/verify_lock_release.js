const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../backend/modules/user/UserModel');
const SuperAceService = require('../backend/modules/game/SuperAceService');

// [CONFIG]
const TEST_USER_ID = 'TEST_LOCK_USER_' + Date.now();
const MONGO_URI = 'mongodb://127.0.0.1:27017/man2man'; // Local DB
const logFile = 'test_output.log';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function runTest() {
    try {
        log("🔵 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
            autoIndex: false,
            autoCreate: false
        });

        if (mongoose.connection.readyState !== 1) {
            throw new Error(`DB Not Ready. State: ${mongoose.connection.readyState}`);
        }
        log("✅ Connected.");

        // TEST RAW
        try {
            await mongoose.connection.db.collection('healthchk').insertOne({ ts: Date.now() });
            log("✅ Raw Insert Success");
        } catch (rawErr) {
            throw new Error(`Raw Insert Failed: ${rawErr.message}`);
        }

        // 1. Create User (RAW MODE to bypass Mongoose timeout)
        log(`🔵 Creating Test User (RAW): ${TEST_USER_ID}`);

        const rawUser = {
            fullName: 'Test User Lock',
            username: TEST_USER_ID,
            primary_phone: '+880' + Math.floor(Math.random() * 1000000000),
            country: 'BD',
            password: 'password', // Plain text for test
            wallet: {
                main: 1000,
                game: 1000,
                game_locked: 500,
                turnover: {
                    required: 10,
                    completed: 0
                }
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            status: 'active'
        };

        const insertRes = await mongoose.connection.db.collection('users').insertOne(rawUser);
        const userId = insertRes.insertedId;
        log(`✅ User Created Raw. ID: ${userId}`);

        // Fetch back via Mongoose to ensure it works
        let user = await User.findById(userId);
        if (!user) throw new Error("User not found via Mongoose!");
        log("✅ Mongoose found the user.");

        // 2. Execute 10 Spins
        log("🔵 Starting 10 Spin Cycle...");

        for (let i = 1; i <= 10; i++) {
            log(`\n🔄 Spin #${i}...`);
            try {
                const result = await SuperAceService.spin(user._id, 10);

                // Reload user to check wallet
                user = await User.findById(user._id);

                log(`   > Locked: ${user.wallet.game_locked}`);
                if (user.wallet.turnover) {
                    log(`   > Spins: ${user.wallet.turnover.completed} / ${user.wallet.turnover.required}`);
                } else {
                    log(`   > Spins: Turnover object missing!`);
                }

                if (result.vault && result.vault.wasReleased) {
                    log(`   🎉 VAULT RELEASED at Spin #${i}! Amount: ${result.vault.releasedAmount}`);
                }

                if (user.wallet.game_locked === 0 && (!user.wallet.turnover || user.wallet.turnover.required === 0)) {
                    log("   ✅ User Wallet Unlocked Fully.");
                    break; // Stop if released early (should happen at 10)
                }
            } catch (spinErr) {
                log(`❌ SPIN FAILED at #${i}: ${spinErr.message}`);
                console.error(spinErr);
                break;
            }
        }

        // 3. Final Verification
        user = await User.findById(user._id);
        if (user.wallet.game_locked === 0 && (user.wallet.game >= 1000)) { // 1000 start - bets + released 500 (approx)
            log("\n✅ SUCCESS: Funds released correctly.");
        } else {
            log("\n❌ FAILURE: Funds not released or balance incorrect.");
            log(`Final State: Locked=${user.wallet.game_locked}, Game=${user.wallet.game}`);
        }

    } catch (e) {
        log("❌ CRITICAL ERROR: " + e.message);
        console.error(e);
    } finally {
        // Cleanup
        if (TEST_USER_ID) {
            try {
                await User.deleteOne({ username: TEST_USER_ID });
                log("🧹 Cleanup Done.");
            } catch (cleanupErr) {
                log("⚠️ Cleanup Error: " + cleanupErr.message);
            }
        }
        await mongoose.disconnect();
    }
}

runTest();
