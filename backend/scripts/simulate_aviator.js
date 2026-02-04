const mongoose = require('mongoose');
const connectDB = require('../kernel/database');

// [MOCK REDIS START]
const mockStore = new Map();
const mockClient = {
    isOpen: true,
    connect: async () => true,
    disconnect: async () => true,
    get: async (key) => mockStore.get(key) || null,
    set: async (key, val) => { mockStore.set(key, String(val)); return 'OK'; },
    del: async (key) => mockStore.delete(key),
    incrByFloat: async (key, val) => {
        const curr = parseFloat(mockStore.get(key) || '0');
        const next = curr + val;
        mockStore.set(key, String(next));
        return next;
    },
    rPush: async (key, val) => {
        const list = JSON.parse(mockStore.get(key) || '[]');
        list.push(val);
        mockStore.set(key, JSON.stringify(list));
        return list.length;
    },
    lRange: async (key, start, end) => {
        const list = JSON.parse(mockStore.get(key) || '[]');
        if (end === -1) return list.slice(start);
        return list.slice(start, end + 1);
    },
    lSet: async (key, index, val) => {
        const list = JSON.parse(mockStore.get(key) || '[]');
        if (list[index]) {
            list[index] = val;
            mockStore.set(key, JSON.stringify(list));
        }
        return 'OK';
    }
};

// PATCH CONFIG BEFORE SERVICE IMPORT
const redisConfig = require('../config/redis');
redisConfig.client = mockClient;
// Alias for simulation function usage
const client = mockClient;
// [MOCK REDIS END]

// [MOCK TRANSACTION HELPER]
const TransactionHelper = {
    runTransaction: async (callback) => {
        try { return await callback(null); }
        catch (e) { console.error('[MOCK_TX] Error:', e.message); throw e; }
    }
};
// Force-populate require cache
const realPath = require.resolve('../modules/common/TransactionHelper');
require.cache[realPath] = {
    id: realPath,
    filename: realPath,
    loaded: true,
    exports: TransactionHelper
};

const AviatorService = require('../modules/game/AviatorService');
const User = require('../modules/user/UserModel');

// Colors for output
const CLR = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    CYAN: '\x1b[36m',
    RESET: '\x1b[0m'
};

/*
    AVIATOR STRESS TEST SIMULATION
    1. Commission Verification (3 Tiers)
    2. Vault Lock Verification (>10x Balance)
    3. Liquidity/Crash Logic
*/

async function runAviatorSimulation() {
    console.log(`${CLR.CYAN}==================================================`);
    console.log(`       AVIATOR ENGINE STRESS TEST (100 ROUNDS)       `);
    console.log(`==================================================${CLR.RESET}`);

    try {
        await connectDB();
        if (!client.isOpen) await client.connect();

        // Wait for DB Connection
        process.stdout.write('Connecting to DB...');
        while (mongoose.connection.readyState !== 1) {
            await new Promise(r => setTimeout(r, 500));
            process.stdout.write('.');
        }
        console.log(' Connected.');

        // 1. Setup Environment
        await client.set('wallet:global_prize_pool', '1000000'); // Healthy Pool
        await client.set('server:active_users', '600'); // Force Tier 3 (15%)

        // Create Test User
        const suffix = Math.random().toString(36).substring(7);
        const testUser = await User.create({
            fullName: 'Aviator Pilot',
            username: `pilot_${encodeURIComponent(suffix)}_${Date.now()}`,
            password: 'x',
            primary_phone: `880${Date.now()}${Math.floor(Math.random() * 100)}`.substring(0, 15),
            country: 'BD',
            wallet: { main: 0, game: 10000 } // Start with 10k
        });
        console.log(`[SETUP] Test User: ${testUser.username} | Balance: ${testUser.wallet.game}`);

        let passedTests = 0;
        const TOTAL_ROUNDS = 100;

        // --- TEST 1: COMMISSION & FLOW ---
        console.log(`\n${CLR.YELLOW}[TEST 1] Commission & Normal Flow${CLR.RESET}`);

        await AviatorService.startRound();
        const betAmt = 1000;
        const betRes = await AviatorService.placeBet(testUser._id, betAmt);

        if (betRes.success) {
            console.log(`✅ Bet Placed: ${betAmt}`);
            // Verify Commission in Redis
            const partner = parseFloat(await client.get('wallet:partner') || '0');
            // Tier 3 = 15% Comm = 150. Partner 40% = 60.
            if (partner > 0) console.log(`✅ Commission Distributed (Partner Wallet > 0)`);
        }

        await AviatorService.takeOff();

        const cashRes = await AviatorService.cashOut(testUser._id, betRes.betId, 2.0); // 2x Multiplier
        if (cashRes.win === 2000) {
            console.log(`✅ Cashout Success: Win 2000 | New Balance: ${cashRes.balance}`);
        } else {
            console.error(`${CLR.RED}❌ Cashout Mismatch: Expected 2000, Got ${cashRes.win}${CLR.RESET}`);
        }

        // --- TEST 2: VAULT LOCK LOGIC ---
        console.log(`\n${CLR.YELLOW}[TEST 2] Vault Lock Logic (>10x Balance)${CLR.RESET}`);
        // Lower User Balance to trigger condition easily
        // We need Win > 10 * Current Balance.
        // Let's set balance to 200. Bet 100. Win 20x (2000). 
        // 2000 > 10 * (200 - 100 + X?) ... wait.
        // Logic uses "Current Balance" at time of cashout.
        // If we Set balance to 100.
        // Bet 100 -> Balance 0.
        // Cashout 20x (Win 2000).
        // 2000 > 10 * 0? Yes. (Technically >0 check usually needed but formula works)

        await User.findByIdAndUpdate(testUser._id, { 'wallet.game': 500, 'wallet.game_locked': 0 });

        await AviatorService.startRound();
        const riskyBet = await AviatorService.placeBet(testUser._id, 100); // Bal now 400

        await AviatorService.takeOff();

        // Cashout 50x -> Win 5000.
        // Check: 5000 > 10 * 400 (4000)? YES. Lock should trigger.
        const lockRes = await AviatorService.cashOut(testUser._id, riskyBet.betId, 50.0);

        if (lockRes.locked > 0) {
            console.log(`${CLR.GREEN}✅ VAULT LOCKED! Win: ${lockRes.win} | Locked: ${lockRes.locked} (70%) ${CLR.RESET}`);
            console.log(`   Detailed Vault: User Locked Balance = ${(await User.findById(testUser._id)).wallet.game_locked}`);
        } else {
            console.error(`${CLR.RED}❌ VAULT FAILED TO LOCK! Win: ${lockRes.win} vs Balance 400*10${CLR.RESET}`);
        }

        // --- TEST 3: LIQUIDITY CRASH SAFETY ---
        console.log(`\n${CLR.YELLOW}[TEST 3] Liquidity Calculation${CLR.RESET}`);
        const totalBets = 50000;
        // Pool is 1M. Max Payout ~970k.
        // Max Safe Mult = 970k / 50k = 19.4x
        const crashPoint = await AviatorService.generateCrashPoint(totalBets);
        console.log(`   Pool: 1,000,000 | Bets: 50,000 | Calc Max Safe: ~19.4x`);
        console.log(`   Generated Crash Point: ${crashPoint}x`);

        if (crashPoint <= 19.4) {
            console.log(`${CLR.GREEN}✅ CRASH POINT SAFE (<= 19.4)${CLR.RESET}`);
        } else {
            console.error(`${CLR.RED}❌ CRASH POINT UNSAFE! (${crashPoint})${CLR.RESET}`);
        }

        // --- ROUND SIMULATION (STRESS) ---
        console.log(`\n${CLR.YELLOW}[STRESS] Running ${TOTAL_ROUNDS} Rounds...${CLR.RESET}`);

        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            // Reset Balance to keep going
            await User.findByIdAndUpdate(testUser._id, { 'wallet.game': 10000 });
            await AviatorService.startRound();

            // Random Bet 100-500
            const b = Math.floor(Math.random() * 400) + 100;
            const br = await AviatorService.placeBet(testUser._id, b);

            await AviatorService.takeOff();

            // Cashout random 1.1 - 5.0
            const mult = 1.0 + (Math.random() * 4);
            await AviatorService.cashOut(testUser._id, br.betId, mult.toFixed(2));

            if (i % 10 === 0) process.stdout.write('.');
        }
        console.log(`\n${CLR.GREEN}✅ ${TOTAL_ROUNDS} Rounds Completed Successfully.${CLR.RESET}`);

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await client.disconnect();
        await mongoose.disconnect();
        process.exit(0);

    } catch (e) {
        console.error(`${CLR.RED}🔥 FATAL ERROR: ${e.message}${CLR.RESET}`);
        console.error(e.stack);
        process.exit(1);
    }
}

runAviatorSimulation();
