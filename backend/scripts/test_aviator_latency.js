const mongoose = require('mongoose');
const AviatorService = require('../modules/game/AviatorService');
const User = require('../modules/user/UserModel');
const { client } = require('../config/redis');
require('dotenv').config();

const RUNS = 10;
const TEST_ID = 'test_user_aviator_' + Date.now();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        await client.connect();

        console.log("Connected. Creating Test User...");

        let user = await User.findOne({ username: 'aviator_speed_tester' });
        if (!user) {
            user = await User.create({
                username: 'aviator_speed_tester',
                fullName: 'Speed Tester',
                primary_phone: '1234567890',
                country: 'TestLand',
                email: 'speed@aviator.test',
                password: 'hash',
                wallet: { main: 1000, game: 5000 }
            });
        } else {
            // Reset Balance
            user.wallet.game = 5000;
            await user.save();
        }

        console.log(`User Ready: ${user._id} | Balance: ${user.wallet.game}`);

        for (let i = 1; i <= RUNS; i++) {
            console.log(`\n--- RUN ${i}/${RUNS} ---`);

            // 1. Force Start Round
            await AviatorService.startRound();
            await new Promise(r => setTimeout(r, 100)); // Sync

            // 2. Place Bet
            const betAmount = 100;
            const betStart = Date.now();
            const betRes = await AviatorService.placeBet(user._id, betAmount);
            const betDuration = Date.now() - betStart;
            console.log(`[BET] Placed in ${betDuration}ms | ID: ${betRes.betId}`);

            // 3. Take Off
            await AviatorService.takeOff();

            // 4. Wait for Multiplier ~1.5x (At 1.0x it starts. 1.5x is ~ln(1.5)/0.065 = ~6.2s)
            // But we can cashout immediately at 1.01x if we want speed.
            // User said "failed cash-out at 1.5x".
            // Let's simulation a quick cashout at 1.1x (~1.4s)

            await new Promise(r => setTimeout(r, 1000));

            // 5. Cash Out
            const mult = 1.20;
            const cashStart = Date.now();
            try {
                const cashRes = await AviatorService.cashOut(user._id, betRes.betId, mult);
                const cashDuration = Date.now() - cashStart;

                console.log(`[CASHOUT] ✅ Success in ${cashDuration}ms | Win: ${cashRes.win}`);

                if (cashDuration > 200) {
                    console.warn(`[SLOW] Cashout took > 200ms!`);
                }
            } catch (e) {
                console.error(`[CASHOUT] ❌ FAILED: ${e.message}`);
                // Log to file as requested (simulated here, but actual code needs it)
            }

            // Cleanup Round
            await AviatorService.completeRound(2.00);
            await new Promise(r => setTimeout(r, 500));
        }

        console.log("\nTest Complete.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runTest();
