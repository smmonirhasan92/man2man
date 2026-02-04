const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const SuperAceService = require('../modules/game/SuperAceService');
const connectDB = require('../kernel/database');
require('dotenv').config();

async function runTest() {
    await connectDB();

    // 1. Setup Test User
    const testPhone = '777_stress_test';
    await User.deleteOne({ primary_phone: testPhone });

    let user = await User.create({
        fullName: 'Stress Tester',
        username: 'stresstester',
        primary_phone: testPhone,
        country: 'TestLand',
        password: 'hash',
        role: 'user',
        wallet: { main: 1000, game: 1000 }
    });

    console.log(`[INIT] User Created: ${user._id} | Game Balance: ${user.wallet.game}`);

    // 2. Run Parallel Spins
    const BET = 10;
    const SPINS = 20;

    console.log(`[TEST] Launching ${SPINS} parallel spins (Bet: ${BET})...`);

    const promises = [];
    for (let i = 0; i < SPINS; i++) {
        // We simulate raw service calls. 
        // Note: SuperAceService.spin logic needs to handle atomic updates for this to work perfectly without specific session logic if not in replica set.
        // But even with sessions, parallel requests fetching same doc version will conflict or overwrite.
        promises.push(
            SuperAceService.spin(user._id, BET, null).catch(e => ({ error: e.message }))
        );
    }

    await Promise.all(promises);

    // 3. Verify Balance
    const finalUser = await User.findById(user._id);
    const expectedMax = 1000 - (SPINS * BET); // Assuming 0 wins for worst case check, but wins add back.
    // Actually wins make it hard to check exact deduction.
    // Let's check turnover? Or just check that at least some money moved.

    console.log(`[RESULT] Final Balance: ${finalUser.wallet.game}`);
    console.log(`[EXPECTED] If 0 wins, should be ${expectedMax}. If wins occurred, balance > ${expectedMax}.`);

    // To strictly test deduction, we might want to temporarily disable wins or mock generateGrid? 
    // But for now let's see if the TransactionHelper throws WriteConflict (good) or silently overwrites (bad).

    process.exit();
}

runTest();
