const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const TurnoverService = require('../modules/wallet/TurnoverService');
const SuperAceService = require('../modules/game/SuperAceService');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runTest() {
    let connection = null;
    try {
        console.log('🔄 Testing Turnover Engine...');
        connection = await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create User
        const user = await User.create({
            username: `turnover_test_${Date.now()}`,
            fullName: 'Turnover Tester',
            phone: `01${Date.now().toString().slice(-9)}`,
            password: '123',
            country: 'BD',
            wallet: { main: 0, game: 0, turnover: { required: 0, completed: 0 } }
        });

        // 2. Simulate Deposit (100) -> 1x Requirement
        console.log('[1] Simulating Deposit 100...');
        await TurnoverService.addRequirement(user._id, 100, 1);

        let u = await User.findById(user._id);
        console.log(`Req: ${u.wallet.turnover.required} (Exp: 100), Comp: ${u.wallet.turnover.completed}`);

        // 3. Simulate Bet (10) -> Progress
        console.log('[2] Simulating Bet 10...');
        // Manually trigger "Record Bet" or use Game Service?
        // Let's use service directly to test isolation first
        await TurnoverService.recordBet(user._id, 10);

        u = await User.findById(user._id);
        console.log(`Req: ${u.wallet.turnover.required}, Comp: ${u.wallet.turnover.completed} (Exp: 10)`);

        // Check Withdrawal
        let check = await TurnoverService.checkWithdrawalEligibility(user._id);
        console.log(`Withdrawal Allowed? ${check.allowed} (Remaining: ${check.stats.remaining})`);

        // 4. Simulate Win (50) -> 20x Requirement -> +1000
        console.log('[3] Simulating Win 50 (x20)...');
        await TurnoverService.addRequirement(user._id, 50, 20);

        u = await User.findById(user._id);
        console.log(`Req: ${u.wallet.turnover.required} (Exp: 1100), Comp: ${u.wallet.turnover.completed}`);

        // 5. Verification
        if (u.wallet.turnover.required === 1100 && u.wallet.turnover.completed === 10) {
            console.log('✅ Turnover Logic Verified.');
        } else {
            console.error('❌ Turnover Logic Failed.');
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        if (connection) await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
