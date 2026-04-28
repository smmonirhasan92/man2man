const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');
const ReferralService = require('../modules/referral/ReferralService');

async function runSimulation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        console.log('--- THE EMPIRE RACE FINANCIAL AUDIT ---');
        console.log('Initializing test accounts...');

        // Create 4 dummy users (A -> B -> C -> D)
        // D buys a package, C gets 12%, B gets 6%, A gets 2.5%

        const cleanUp = async () => {
            await User.deleteMany({ username: { $in: ['simUserA', 'simUserB', 'simUserC', 'simUserD'] } });
        };
        await cleanUp();

        const userA = await User.create({
            fullName: 'Sim User A',
            username: 'simUserA',
            password: 'password123',
            email: 'simA@test.com',
            primary_phone: '000000000A',
            referralCode: 'CODE_A',
            wallet: { main: 0, income: 0 }
        });

        const userB = await User.create({
            fullName: 'Sim User B',
            username: 'simUserB',
            password: 'password123',
            email: 'simB@test.com',
            primary_phone: '000000000B',
            referralCode: 'CODE_B',
            referredBy: 'CODE_A',
            wallet: { main: 0, income: 0 }
        });

        const userC = await User.create({
            fullName: 'Sim User C',
            username: 'simUserC',
            password: 'password123',
            email: 'simC@test.com',
            primary_phone: '000000000C',
            referralCode: 'CODE_C',
            referredBy: 'CODE_B',
            wallet: { main: 0, income: 0 }
        });

        const userD = await User.create({
            fullName: 'Sim User D',
            username: 'simUserD',
            password: 'password123',
            email: 'simD@test.com',
            primary_phone: '000000000D',
            referralCode: 'CODE_D',
            referredBy: 'CODE_C',
            wallet: { main: 0, income: 0 }
        });

        const planAmount = 10000; // 10000 NXS ($100)
        console.log(`\nUser D is purchasing a package worth ${planAmount} NXS...`);

        // Run the distribution
        const result = await ReferralService.distributePlanCommission(userD._id, planAmount, 'Test VIP Plan');

        console.log(`\nDistribution Result:`, result);

        // Fetch balances
        const a = await User.findById(userA._id);
        const b = await User.findById(userB._id);
        const c = await User.findById(userC._id);

        console.log('\n--- WALLET AUDIT ---');
        console.log(`User C (Level 1 - Direct) Expected: 12% (${planAmount * 0.12} NXS) | Actual: ${c.wallet.income} NXS`);
        console.log(`User B (Level 2 - Grandparent) Expected: 6% (${planAmount * 0.06} NXS) | Actual: ${b.wallet.income} NXS`);
        console.log(`User A (Level 3 - Great Grandparent) Expected: 2.5% (${planAmount * 0.025} NXS) | Actual: ${a.wallet.income} NXS`);

        let totalExpected = planAmount * 0.12 + planAmount * 0.06 + planAmount * 0.025;
        let totalActual = c.wallet.income + b.wallet.income + a.wallet.income;

        console.log(`\nTotal Expected Distributed: ${totalExpected} NXS`);
        console.log(`Total Actual Distributed: ${totalActual} NXS`);

        if (totalExpected === totalActual) {
            console.log('\n🟢 AUDIT PASSED: The math is 100% accurate. Zero leakage.');
        } else {
            console.log('\n🔴 AUDIT FAILED: Discrepancy found!');
        }

        console.log('\n--- TOUR SALES AUDIT ---');
        console.log(`User C Tour Sales (Package > 5000 NXS): Expected: 1 | Actual: ${c.tourSales || 0}`);
        
        await cleanUp();
        console.log('Cleanup complete.');
        process.exit(0);

    } catch (e) {
        console.error('Simulation Failed:', e);
        process.exit(1);
    }
}

runSimulation();
