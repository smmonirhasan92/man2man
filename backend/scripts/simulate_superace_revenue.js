const mongoose = require('mongoose');
const { createClient } = require('redis');
const SuperAceService = require('../modules/game/SuperAceServiceV2');
const User = require('../modules/user/UserModel');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Plain Console Output
const CLR = {
    RESET: "",
    RED: "",
    GREEN: "",
    YELLOW: "",
    BLUE: "",
    CYAN: ""
};

async function runSimulation() {
    console.log("Starting SuperAce 1000-User Revenue Simulation...");

    // 1. Connections
    await mongoose.connect(MONGO_URI);
    // 2. Setup Mock Redis (In-Memory)
    // We override the singleton exported by config/redis
    const redisConfig = require('../config/redis');
    console.log("DEBUG: redisConfig keys:", Object.keys(redisConfig));

    const mockStore = new Map();

    // Implement Mock Methods
    const mockClient = {
        isOpen: true,
        connect: async () => { },
        disconnect: async () => { },
        get: async (key) => mockStore.get(key) || null,
        set: async (key, val, opts) => {
            // Handle NX (Not Exists) - simple partial impl logic
            if (opts && opts.NX && mockStore.has(key)) return null;
            mockStore.set(key, String(val));
            return 'OK';
        },
        del: async (key) => mockStore.delete(key),
        incr: async (key) => {
            const val = parseInt(mockStore.get(key) || '0') + 1;
            mockStore.set(key, String(val));
            return val;
        },
        decr: async (key) => {
            const val = parseInt(mockStore.get(key) || '0') - 1;
            mockStore.set(key, String(val));
            return val;
        },
        incrBy: async (key, amount) => {
            const val = parseInt(mockStore.get(key) || '0') + amount;
            mockStore.set(key, String(val));
            return val;
        },
        incrByFloat: async (key, amount) => {
            const current = parseFloat(mockStore.get(key) || '0');
            const newVal = current + amount;
            mockStore.set(key, String(newVal)); // Store as string to mimic Redis
            return newVal;
        }
    };

    // Override the exported client methods
    redisConfig.client = mockClient;
    const redisClient = redisConfig.client; // Use this for our script too

    console.log(`${CLR.GREEN}✅ Redis Mocking Active (In-Memory)${CLR.RESET}`);

    // 3. Setup Test User
    const TEST_USER_ID = new mongoose.Types.ObjectId();
    const TEST_USER_PHONE = '01sim1000user';

    await User.deleteMany({ primary_phone: TEST_USER_PHONE });

    const user = await User.create({
        fullName: 'Sim User',
        username: 'sim_user_1000',
        primary_phone: TEST_USER_PHONE,
        password: 'hash',
        country: 'BD',
        role: 'user',
        wallet: { main: 0, game: 10000000, income: 0, turnoverRequired: 0, game_locked: 0 }
    });

    console.log(`${CLR.GREEN}✅ Test User Created: ${user._id}${CLR.RESET}`);

    // 3. Helper to snapshot Redis Wallets
    async function getWalletSnapshot() {
        const tech = parseFloat(await redisClient.get('wallet:tech') || '0');
        const replay = parseFloat(await redisClient.get('wallet:replay') || '0');
        const partner = parseFloat(await redisClient.get('wallet:partner') || '0');
        const pool = parseFloat(await redisClient.get('wallet:global_prize_pool') || '0');
        return { tech, replay, partner, pool };
    }

    // 4. Simulation Engine
    const scenarios = [
        { name: "TIER_1 (<50 Users)", users: 10, spins: 333, commissionRate: 0.08, expectedTier: "TIER_1_8%" },
        { name: "TIER_2 (50-500 Users)", users: 100, spins: 333, commissionRate: 0.10, expectedTier: "TIER_2_10%" },
        { name: "TIER_3 (>500 Users)", users: 600, spins: 334, commissionRate: 0.15, expectedTier: "TIER_3_15%" }
    ];

    let totalSpins = 0;
    const BET_AMOUNT = 1000; // Increased to 1000 to minimize integer rounding errors
    const reportData = [];

    // Reset Wallets (Optional, but good for clean report. Using delta is safer)
    // We will use DELTA.

    for (const scenario of scenarios) {
        console.log(`\n${CLR.YELLOW}▶ Running Scenario: ${scenario.name}${CLR.RESET}`);
        console.log(`   - Active Users: ${scenario.users}`);
        console.log(`   - Spins: ${scenario.spins}`);

        // A. Set Active Users
        await redisClient.set('server:active_users', scenario.users);

        // B. Snapshot Start
        const startSnapshot = await getWalletSnapshot();

        // C. Run Spins
        let scenarioBetTotal = 0;
        let scenarioWinTotal = 0;
        let vaultLockedTotal = 0;
        let scenarioFreeSpins = 0;
        let scenarioPaidSpins = 0;

        for (let i = 0; i < scenario.spins; i++) {
            // Check tier logs occasionally? 
            // We just run logic.
            try {
                const res = await SuperAceService.spin(user._id, BET_AMOUNT);

                if (res.isFreeSpin) {
                    // Free spin: User didn't pay, so no commission expected on this spin
                    scenarioFreeSpins++;
                } else {
                    // Paid spin: User paid, commission shoud be generated
                    scenarioBetTotal += BET_AMOUNT;
                    scenarioPaidSpins++;
                }

                scenarioWinTotal += res.win;
                if (res.locked_balance) {
                    // This creates noise because locked balance accumulates.
                }

                // Track Vault Lock events if possible. 
                // The service logs `VAULT_LOCK`, but we can't easily read console log here.
                // We can infer from User's game_locked.
            } catch (e) {
                console.error(`Spin Error: ${e.message}`);
            }
            if (i % 50 === 0) process.stdout.write('.');
        }
        process.stdout.write('\n');

        // D. Snapshot End & Refresh User
        const endSnapshot = await getWalletSnapshot();
        const updatedUser = await User.findById(user._id);
        const lockedStart = user.wallet.game_locked || 0;
        const lockedEnd = updatedUser.wallet.game_locked || 0;
        const lockedInScenario = lockedEnd - lockedStart;

        // E. Calculate Deltas
        const delta = {
            tech: endSnapshot.tech - startSnapshot.tech,
            replay: endSnapshot.replay - startSnapshot.replay,
            partner: endSnapshot.partner - startSnapshot.partner,
            pool: endSnapshot.pool - startSnapshot.pool
        };

        const totalCommission = delta.tech + delta.replay + delta.partner;
        const calculatedRate = totalCommission / scenarioBetTotal;
        const poolIn = scenarioBetTotal - totalCommission;

        console.log(`${CLR.BLUE}   [RESULTS]${CLR.RESET}`);
        console.log(`   - Total Bet: ${scenarioBetTotal}`);
        console.log(`   - Commission Generated: ${totalCommission.toFixed(2)} (${(calculatedRate * 100).toFixed(2)}%)`);
        console.log(`   - Tech (30%): ${delta.tech.toFixed(2)}`);
        console.log(`   - Replay (30%): ${delta.replay.toFixed(2)}`);
        console.log(`   - Partner (40%): ${delta.partner.toFixed(2)}`);
        console.log(`   - Pool Input: ${poolIn.toFixed(2)}`);
        console.log(`   - Vault Locked: ${lockedInScenario.toFixed(2)}`);

        reportData.push({
            scenario: scenario.name,
            bet: scenarioBetTotal,
            commission: totalCommission,
            rate: (calculatedRate * 100).toFixed(1) + '%',
            tech: delta.tech,
            replay: delta.replay,
            partner: delta.partner,
            vault: lockedInScenario,
            pass: Math.abs(calculatedRate - scenario.commissionRate) < 0.001
        });

        // Update local user object for next loop reference (specifically game_locked)
        user.wallet.game_locked = updatedUser.wallet.game_locked;
    }

    // 5. Generate Report
    console.log(`\n${CLR.CYAN}📊 REVENUE DISTRIBUTION REPORT${CLR.RESET}`);
    console.table(reportData);

    // 6. Verification
    const allPassed = reportData.every(r => r.pass);
    if (allPassed) {
        console.log(`\n${CLR.GREEN}✅ SUCCESS: All Tiers Validated Correctly.${CLR.RESET}`);
    } else {
        console.log(`\n${CLR.RED}❌ FAILURE: Some Revenue Tiers Mismatched.${CLR.RESET}`);
    }

    await mongoose.disconnect();
    await redisClient.disconnect();
    process.exit(0);
}

runSimulation().catch(e => {
    console.error(e);
    process.exit(1);
});
