const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const LotteryService = require('../modules/game/LotteryService');
const LotterySlot = require('../modules/game/LotterySlotModel');
const User = require('../modules/user/UserModel');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI && process.env.MONGO_URI) process.env.MONGODB_URI = process.env.MONGO_URI;

let logBuffer = "";
function log(msg) {
    console.log(msg);
    logBuffer += msg + "\n";
}

async function main() {
    try {
        log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        log("✅ DB Connected");

        // 1. Verify Active Slots
        log("\n--- Active Lottery Slots ---");
        const slots = await LotterySlot.find({ status: { $in: ['ACTIVE', 'DRAWING'] } });

        const pricePoints = new Set();
        slots.forEach(s => {
            log(`Slot ID: ${s._id} | Tier: ${s.tier} | Price: ${s.ticketPrice || 'Default'} | Prize: ${s.prizeAmount}`);
            if (s.ticketPrice) pricePoints.add(s.ticketPrice);
        });

        const expectedPrices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
        const missing = expectedPrices.filter(p => !pricePoints.has(p));

        if (missing.length === 0) {
            log("✅ All price tiers (10-120 BDT) are ACTIVE.");
        } else {
            log(`⚠️ Missing active slots for prices: ${missing.join(', ')}`);
        }

        // 2. Simulate Draw Cycle
        log("\n--- Simulating Draw Cycle ---");
        const targetSlot = slots.find(s => s.status === 'ACTIVE');

        if (!targetSlot) {
            log("❌ No active slot found to test!");
        } else {
            log(`Testing Draw on Slot: ${targetSlot.tier} (ID: ${targetSlot._id})`);

            let user = await User.findOne({ username: 'test55' });
            if (!user) {
                log("Creating test user 'test55'...");
                user = await User.create({
                    username: 'test55',
                    email: 'test55@sim.com',
                    password: 'password123',
                    wallet: { main: 5000, game: 0 }
                });
            }

            const initialBalance = user.wallet.main;
            const price = targetSlot.ticketPrice || 20;
            log(`User Balance: ${initialBalance}. Buying 1 ticket for ${price}...`);

            try {
                const buyResult = await LotteryService.buyTicket(user._id, 1, targetSlot._id);
                log(`✅ Ticket Bought. New Balance: ${buyResult.balance}`);

                log("Forcing Draw...");
                await LotteryService.startDrawSequence(targetSlot._id, true);

                log("Waiting for draw finalization (8s)...");
                await new Promise(r => setTimeout(r, 8000));

                const finalSlot = await LotterySlot.findById(targetSlot._id);
                log(`Slot Status: ${finalSlot.status}`);
                if (finalSlot.status === 'COMPLETED') {
                    log("✅ Draw Cycle Completed Successfully.");
                    if (finalSlot.winners && finalSlot.winners.length > 0) {
                        log(`🏆 Winners: ${finalSlot.winners.length}`);
                    } else {
                        log("No winners (expected if only 1 ticket and likely loss).");
                    }
                } else {
                    log("❌ Draw did not complete. Status: " + finalSlot.status);
                }

            } catch (err) {
                log("❌ Error during simulation: " + err.message);
            }
        }

    } catch (e) {
        log("Critical Error: " + e.message);
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('d:/man2man/sim_report.txt', logBuffer, 'utf8');
        process.exit();
    }
}

main();
