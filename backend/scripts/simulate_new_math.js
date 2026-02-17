const SuperAceService = require('../modules/game/SuperAceService');

async function runSimulation() {
    console.log("🔥 Starting Super Ace Gameplay Analysis (100 Spins)...");
    console.log("-----------------------------------------------------");

    // Mock Wallet
    let wallet = {
        balance: 1000,
        locked: 0,
        turnover: { required: 0, completed: 0 }
    };

    let stats = {
        spins: 0,
        wins: 0,
        losses: 0,
        traps: 0,
        sustainWins: 0, // 0.8x - 1.5x
        bigWins: 0,     // 1.5x - 4.0x
        superWins: 0,   // > 4.0x (Trapped)
        totalIn: 0,
        totalOut: 0,
        nearMisses: 0
    };

    const BET = 10;
    const SPINS = 100;

    // --- MATH CONSTANTS (Mirrors SuperAceService.js SOLO MODE) ---
    // SOLO MODE: Hit Rate 48%, Pity 4 (High Engagement)
    const BASE_HIT_RATE = 0.48;
    const TRAP_THRESHOLD = 5.0; // Strict Trap > 5x
    const PITY_THRESHOLD = 4;
    let lossStreak = 0;

    for (let i = 1; i <= SPINS; i++) {
        stats.spins++;
        stats.totalIn += BET;
        wallet.balance -= BET;
        wallet.turnover.completed += BET;

        // Check Vault Release
        if (wallet.locked > 0 && wallet.turnover.completed >= wallet.turnover.required) {
            console.log(`[SPIN ${i}] 🔓 VAULT UNLOCKED! Released ৳${wallet.locked.toFixed(2)}`);
            wallet.balance += wallet.locked;
            wallet.locked = 0;
            wallet.turnover.required = 0;
            wallet.turnover.completed = 0;
        }

        // --- CORE LOGIC ---
        let isWin = Math.random() < BASE_HIT_RATE;
        let isPity = false;

        // Pity Logic
        if (lossStreak >= PITY_THRESHOLD) {
            isWin = true;
            isPity = true;
            lossStreak = 0;
            console.log(`[SPIN ${i}] 🛡️ Pity Triggered (Hook)`);
        }

        let multiplier = 0;
        let winAmount = 0;

        if (isWin) {
            lossStreak = 0;
            const rand = Math.random();

            if (isPity) {
                // Hook Win: 0.5x - 2.0x usually, but chance for 5x excitement
                multiplier = 0.5 + (Math.random() * 1.5);
            } else {
                // [SOLO MODE DISTRIBUTION]
                // 00-40%: Small Sustain (0.5x - 1.2x)
                if (rand < 0.40) multiplier = 0.5 + (Math.random() * 0.7);
                // 40-75%: Profit (1.2x - 3.2x)
                else if (rand < 0.75) multiplier = 1.2 + (Math.random() * 2.0);
                // 75-90%: Big Win (3.0x - 6.0x)
                else if (rand < 0.90) multiplier = 3.0 + (Math.random() * 3.0);
                // 90-100%: Super Trap (>8.0x)
                else multiplier = 8.0 + (Math.random() * 10.0);
            }

            winAmount = parseFloat((BET * multiplier).toFixed(2));
            stats.wins++;
            stats.totalOut += winAmount;

            // Stats Categorization
            if (multiplier >= 0.8 && multiplier <= 1.5) stats.sustainWins++;
            else if (multiplier > 1.5 && multiplier <= 4.0) stats.bigWins++;
            else if (multiplier > 4.0) stats.superWins++;

            // Trap Logic
            if (multiplier > TRAP_THRESHOLD && !isPity) {
                stats.traps++;
                wallet.locked += winAmount;
                const req = winAmount * 3;
                wallet.turnover.required += req;
                console.log(`[SPIN ${i}] 🪤 TRAP! Win: ৳${winAmount} (${multiplier.toFixed(2)}x) -> Locked. Req: ৳${req.toFixed(0)}`);
            } else {
                wallet.balance += winAmount;
                console.log(`[SPIN ${i}] ✅ WIN: ৳${winAmount} (${multiplier.toFixed(2)}x)`);
            }

        } else {
            lossStreak++;
            stats.losses++;
            // Near Miss Check
            if (Math.random() < 0.35) {
                stats.nearMisses++;
                console.log(`[SPIN ${i}] ❌ LOSS (Near Miss Tease)`);
            } else {
                console.log(`[SPIN ${i}] ❌ LOSS`);
            }
        }
    }

    console.log("\n📊 GAMEPLAY REPORT (100 Spins)");
    console.log("-----------------------------------------------------");
    console.log(`Total Spins: ${stats.spins}`);
    console.log(`Bet Total:   ৳${stats.totalIn}`);
    console.log(`Payout Total:৳${stats.totalOut.toFixed(2)}`);
    console.log(`RTP (Calc):  ${((stats.totalOut / stats.totalIn) * 100).toFixed(2)}%`);
    console.log(`\nWins: ${stats.wins} | Losses: ${stats.losses}`);
    console.log(`Hit Rate:    ${((stats.wins / stats.spins) * 100).toFixed(1)}%`);
    console.log(`\nWin Types:`);
    console.log(`- Sustain (0.8x-1.5x): ${stats.sustainWins}`);
    console.log(`- Profit  (1.5x-4.0x): ${stats.bigWins}`);
    console.log(`- TRAPS   (>4.0x):     ${stats.traps} 🪤`);
    console.log(`\nEngagement:`);
    console.log(`- Near Misses: ${stats.nearMisses}`);
    console.log(`- Pity Triggers: calculated internally`);
    console.log(`\nFinal Wallet:`);
    console.log(`- Cash:   ৳${wallet.balance.toFixed(2)}`);
    console.log(`- Locked: ৳${wallet.locked.toFixed(2)}`);
    console.log("-----------------------------------------------------");
}

runSimulation();
