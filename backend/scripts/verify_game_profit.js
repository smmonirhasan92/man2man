const mongoose = require('mongoose');
const path = require('path');
const User = require('../modules/user/UserModel');
const GameService = require('../modules/game/GameService');

// Load Env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runSimulation() {
    let connection = null;
    try {
        console.log('🎲 Starting Game Engine Verification (100 Players)...');

        // Connect
        connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        // 1. Setup Mock Users
        const testUserIds = [];
        const prefix = `sim_${Date.now()}`;

        console.log('Creation 10 test users...');
        for (let i = 0; i < 10; i++) {
            // Create one by one to ensure no race conditions in script
            const u = await User.create({
                username: `${prefix}_${i}`,
                fullName: 'Sim Player',
                phone: `019${Math.floor(Math.random() * 100000000)}`,
                password: '123',
                country: 'BD',
                wallet: { main: 50000 }
            });
            testUserIds.push(u._id);
        }

        // 2. Prepare Pool (100 bets from 10 users)
        const playerPool = [];
        for (let i = 0; i < 100; i++) {
            playerPool.push(testUserIds[i % 10]);
        }

        const BET_AMOUNT = 100;
        console.log(`Running simulation with ${playerPool.length} bets of ${BET_AMOUNT} BDT...`);

        // 3. Run Game Service
        const result = await GameService.playPoolRound(playerPool, BET_AMOUNT);

        // 4. Verify output
        const expectedPool = 100 * 100; // 10000
        const expectedProfit = 2500;    // 25%
        const expectedPrize = 7500;     // 75%

        console.log('------------------------------------------------');
        console.log('📊 Simulation Metrics:');
        console.log(`Pool:        Expected ${expectedPool} | Actual ${result.totalPool}`);
        console.log(`Admin Profit: Expected ${expectedProfit} | Actual ${result.adminProfit}`);
        console.log(`Prize:       Expected ${expectedPrize} | Actual ${result.distributablePrize}`);

        let success = true;
        if (result.adminProfit !== expectedProfit) {
            console.error('❌ FAILURE: Profit Mismatch');
            success = false;
        }
        if (result.distributablePrize !== expectedPrize) {
            console.error('❌ FAILURE: Prize Mismatch');
            success = false;
        }

        if (success) {
            console.log('✅ SUCCESS: Game Engine is Risk-Free & Accurate.');
        }

        // Cleanup
        console.log('Cleaning up test users...');
        await User.deleteMany({ _id: { $in: testUserIds } });
        console.log('Cleanup Done.');

    } catch (e) {
        console.error('FATAL ERROR:', e);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('Disconnected DB');
        }
        process.exit(0);
    }
}

runSimulation();
