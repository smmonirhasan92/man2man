const mongoose = require('mongoose');
const { client } = require('../config/redis');
const IntelligenceController = require('../modules/game/IntelligenceController');

(async () => {
    try {
        await client.connect();

        // Mock User Classifications
        // A: 501, B: 10, C: 10 Spincount < 10

        console.log("=== SIMULATION START ===");

        // 1. Class B Accumulation
        console.log("\n[TEST 1] Class B (Micro) Accumulation");
        const initMicro = parseFloat(await client.get('pool:class_b') || '0');
        console.log(`Initial Micro Pool: ${initMicro}`);

        for (let i = 0; i < 50; i++) {
            await IntelligenceController.decideOutcome('user_micro', 10, 'super_ace');
        }

        const midMicro = parseFloat(await client.get('pool:class_b') || '0');
        console.log(`Mid Micro Pool (After 50 spins): ${midMicro} (Diff: ${midMicro - initMicro})`);

        // 2. Class A (Whale) Payout Check
        console.log("\n[TEST 2] Class A (Whale) P2P Funding");
        // Force a Whale Spin
        const decisionA = await IntelligenceController.decideOutcome('user_whale', 1000, 'super_ace');
        console.log(`Whale Result: ${JSON.stringify(decisionA)}`);

        // 3. Tax Check
        // If Whale won significant amount, check Tax on House Reserve
        if (decisionA.win > 1000) {
            const taxReserve = parseFloat(await client.get('wallet:house_reserve') || '0');
            console.log(`House Reserve after Tax: ${taxReserve}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
