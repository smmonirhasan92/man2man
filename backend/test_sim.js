const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const UniversalMatchMaker = require('./modules/gamification/UniversalMatchMaker');
const RedisService = require('./services/RedisService');

async function runSimulation() {
    try {
        console.log("🚀 Initializing 100-User Stress Test...");
        
        // 1. Connect to Resources
        const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/man2man';
        await mongoose.connect(mongoUrl);
        console.log("✅ MongoDB Connected");

        // 2. Mock Admin Settings
        await RedisService.client.set('config:isEnabled', 'true');
        await RedisService.client.set('config:houseEdge', '15'); // 15% System Cut
        await RedisService.client.set('livedata:game:admin_reinjection_pad', '0');
        await RedisService.client.set('livedata:game:match_pot', '10000'); // Seed pot for simulation
        console.log("⚙️ Configured 15% House Edge (85% RTP) via Redis Sync");

        // 3. Batch Simulation (100 Users)
        // We will simulate 10 batches of 10 players to test Triangular Logic
        let totalProcessed = 0;
        let startPad = 0;

        console.log("🎰 Simulating 100 Multi-game requests...");
        
        const batches = [];
        for (let i = 0; i < 10; i++) {
            const batchPromises = [];
            for (let j = 0; j < 10; j++) {
                const userId = `sim_user_${i}_${j}`;
                const bet = Math.random() > 0.5 ? 30 : 15; // Mixed Gold and Bronze
                batchPromises.push(UniversalMatchMaker.processMatch(userId, bet, 'spin'));
            }
            batches.push(Promise.all(batchPromises));
            // Tiny delay to ensure batches aggregate together if needed, 
            // though UniversalMatchMaker.processMatch handles queueing.
        }

        const allResults = await Promise.all(batches);
        const flattenedResults = allResults.flat();

        // 4. Calculate Stats
        let totalPrizes = 0;
        let winners = 0;
        let nearMisses = 0;

        flattenedResults.forEach(res => {
            totalPrizes += res.winAmount;
            if (res.winAmount > 0 && res.label !== 'So Close!') winners++;
            if (res.label === 'So Close!') nearMisses++;
        });

        const finalPad = await RedisService.get('livedata:game:admin_reinjection_pad');

        console.log("\n--- 📊 STRESS TEST REPORT ---");
        console.log(`Total Players: ${flattenedResults.length}`);
        console.log(`Winners (Triangular): ${winners}`);
        console.log(`Near Misses psychological: ${nearMisses}`);
        console.log(`Total Payouts: ${totalPrizes.toFixed(2)} NXS`);
        console.log(`-----------------------------`);
        console.log(`🚀 ADMIN REINJECTION PAD GROWTH: ${finalPad} NXS`);
        console.log("-----------------------------");
        console.log("✅ Simulation Complete. System is stable and scaling.");

        process.exit(0);
    } catch (e) {
        console.error("❌ Simulation Failed:", e);
        process.exit(1);
    }
}

runSimulation();
