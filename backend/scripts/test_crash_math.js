const { generateSecureCrashPoint } = require('../modules/gamification/CrashGameEngine');

async function runCrashSimulator() {
    console.log("=== UNIVERSAL MULTIPLIER API - 100x SIMULATION ===");
    
    // Initial State
    let state = {
        poolLiquidity: 0.00, // Starts empty
        adminCommission: 0.00,
        totalRounds: 100,
        platformBankruptcies: 0
    };

    let metrics = {
        totalBetsIn: 0,
        totalPayoutsOut: 0,
        highestMultiplier: 0
    };

    for (let i = 1; i <= state.totalRounds; i++) {
        // 1. Simulate 5 to 50 players betting between 1 to 10 NXS each
        const numPlayers = Math.floor(Math.random() * 45) + 5;
        let roundBets = 0;
        let players = [];
        
        for(let p=0; p<numPlayers; p++) {
            const betAmount = Math.floor(Math.random() * 9) + 1;
            roundBets += betAmount;
            
            // Randomly determine when this player INTENDS to cash out (if they survive)
            // Most players cash out between 1.1x and 2.5x, some greedy ones wait for 10x
            let intendedCashOut = 1.05 + (Math.random() * Math.random() * 5); 
            players.push({ bet: betAmount, intendedCashOut });
        }
        
        metrics.totalBetsIn += roundBets;

        // 2. Admin Logic (10% Margin)
        const roundMargin = parseFloat((roundBets * 0.10).toFixed(4));
        const contribution = roundBets - roundMargin;
        
        state.adminCommission += roundMargin;
        state.poolLiquidity += contribution;

        // 3. Generate Secure Crash Point
        const crashPoint = generateSecureCrashPoint(state.poolLiquidity, roundBets);
        if (crashPoint > metrics.highestMultiplier) metrics.highestMultiplier = crashPoint;

        // 4. Evaluate Player Outcomes
        let roundPayouts = 0;
        let winners = 0;
        
        players.forEach(player => {
            if (player.intendedCashOut < crashPoint) {
                // They successfully cashed out before it crashed!
                const payout = player.bet * player.intendedCashOut;
                roundPayouts += payout;
                winners++;
            }
        });

        // 5. Deduct from Pool
        state.poolLiquidity -= roundPayouts;
        metrics.totalPayoutsOut += roundPayouts;

        // 6. Bankruptcy Check [CRITICAL]
        if (state.poolLiquidity < 0) {
            console.log(`\n[FATAL ERROR] Platform Bankrupt at Round ${i}! Liquidity: ${state.poolLiquidity}`);
            state.platformBankruptcies++;
            break; // Stop immediately
        }

        // Print sample output every 10 rounds
        if (i % 10 === 0 || i === 1) {
            console.log(`Round ${i}: Bets=${roundBets} NXS | Pool=${state.poolLiquidity.toFixed(2)} | Crash=@${crashPoint}x | Payout=${roundPayouts.toFixed(2)} (${winners}/${numPlayers} won)`);
        }
    }

    console.log("\n--- 100x SIMULATION RESULTS ---");
    console.log(`Total Rounds Flown: ${state.totalRounds}`);
    console.log(`Total Bets Wagered: ${metrics.totalBetsIn.toFixed(2)} NXS`);
    console.log(`Total Player Payouts: ${metrics.totalPayoutsOut.toFixed(2)} NXS`);
    console.log(`Peak Multiplier Generated: ${metrics.highestMultiplier.toFixed(2)}x`);
    console.log(`Total Admin Profit (10%): ${state.adminCommission.toFixed(2)} NXS`);
    console.log(`Current Pool Liquidity Reserves: ${state.poolLiquidity.toFixed(2)} NXS`);
    
    if (state.platformBankruptcies === 0) {
        console.log("\n ✅ TEST PASSED: 0% BALANCE LEAKS. PLATFORM REMAINS PROFITABLE AND SOLVENT. \n");
    } else {
        console.log("\n ❌ TEST FAILED: Mathematical bounds broken. \n");
    }

}

runCrashSimulator();
