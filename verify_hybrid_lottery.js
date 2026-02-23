const mongoose = require('mongoose');
const User = require('./backend/models/User');
const LotterySlot = require('./backend/modules/game/LotterySlotModel');
const LotteryService = require('./backend/modules/game/LotteryService');
require('dotenv').config({ path: './backend/.env' });

async function runTest() {
    try {
        console.log("==========================================");
        console.log("🚀 STARTING HYBRID LOTTERY TEST SUITE");
        console.log("==========================================");

        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Database Connected");

        // 1. Setup Test Users
        console.log("\n[1] Creating Test Users...");
        const users = [];
        for (let i = 0; i < 3; i++) {
            let u = await User.findOne({ username: `hybridplayer${i}` });
            if (!u) {
                u = await User.create({
                    username: `hybridplayer${i}`,
                    email: `hybrid${i}@test.com`,
                    password: 'password123',
                    wallet: { main: 50000, game: 0 }
                });
            } else {
                u.wallet.main = 50000;
                await u.save();
            }
            users.push(u);
            console.log(`- Created User ${i}: ${u._id} | Balance: 50,000`);
        }

        const adminUser = users[0];
        const normalUser1 = users[1];
        const targetWinner = users[2];

        // Ensure no active slot interferes
        await LotterySlot.updateMany({}, { status: 'COMPLETED' });

        // 2. Test Time-Based Lottery (Fast)
        console.log("\n[2] Testing TIME_BASED Lottery...");
        const timePayload = {
            prizes: [{ name: 'Test Jackpot', amount: 1000, winnersCount: 1 }],
            drawType: 'TIME_BASED',
            targetWinnerId: null, // Fair draw
            ticketPrice: 100
        };
        const timeSlot = await LotteryService.createSlot(timePayload, 2, 'FLASH_TEST', 1); // 1 min duration
        console.log(`✅ TIME_BASED Slot Created: ${timeSlot.slotId}`);
        console.log(`   End Time: ${timeSlot.endTime}`);

        // Buy multiple tickets
        console.log("\n   -> Bulk Ticket Purchase Test (Normal User)");
        const buyRes1 = await LotteryService.buyTicket(normalUser1._id, 10, timeSlot.slotId);
        console.log(`✅ Bulk Buy 10 tickets Success. Remaining Balance: ${buyRes1.remainingBalance}`);

        // 3. Test Sales-Based Lottery with Forced Winner
        console.log("\n[3] Testing SALES_BASED Lottery (MANUAL OVERRIDE)...");
        const salesPayload = {
            prizes: [
                { name: '1st Prize', amount: 5000, winnersCount: 1 },
                { name: '2nd Prize', amount: 1000, winnersCount: 1 },
            ],
            drawType: 'SALES_BASED',
            targetWinnerId: targetWinner._id, // RIGGED WINNER
            ticketPrice: 500
        };
        const salesSlot = await LotteryService.createSlot(salesPayload, 1, 'RIGGED_TEST', 0);
        console.log(`✅ SALES_BASED Slot Created: ${salesSlot.slotId} | Target: ${salesSlot.targetSales}`);
        console.log(`   TARGET WINNER INJECTED: ${targetWinner._id}`);

        // Normal User buys tickets
        await LotteryService.buyTicket(normalUser1._id, 5, salesSlot.slotId); // 2500 BDT
        console.log(`   -> Normal User bought 5 tickets.`);

        // Target Winner MUST buy at least one ticket to be eligible for rig
        await LotteryService.buyTicket(targetWinner._id, 1, salesSlot.slotId); // 500 BDT
        console.log(`   -> Target Winner bought 1 ticket.`);

        // Force Admin Draw
        console.log(`\n   -> Triggering Force Draw...`);
        await LotteryService.manualDraw(salesSlot.slotId, null); // Use slot's injected targetWinnerId

        // Verify Target Winner got the 1st prize
        const updatedTarget = await User.findById(targetWinner._id);
        const expectedBalance = 50000 - 500 + 5000; // start - ticket + 1st prize
        console.log(`\n[4] 📊 Verification Results (Sales-Based Manual Draw):`);
        console.log(`Target Winner Balance: ${updatedTarget.wallet.main} (Expected: ~${expectedBalance})`);

        if (updatedTarget.wallet.main >= expectedBalance) {
            console.log("✅ Target Winner successfully received 1st Prize!");
        } else {
            console.error("❌ Target Winner did NOT receive the expected prize.");
        }

        console.log("\n==========================================");
        console.log("🏁 HYBRID TEST SUITE FINISHED");
        console.log("==========================================");

    } catch (e) {
        console.error("❌ Test Failed:", e);
    } finally {
        process.exit();
    }
}

runTest();
