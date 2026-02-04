const mongoose = require('mongoose');
const SuperAceService = require('../modules/game/SuperAceService');
const User = require('../modules/user/UserModel');
const TransactionHelper = require('../modules/common/TransactionHelper');

require('dotenv').config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/man2man_test_admin';

async function verifySuperAce() {
    console.log("♠️ Starting Super Ace Logic Verification...");
    try {
        await mongoose.connect(DB_URI);

        // 1. Setup User
        await User.deleteMany({ username: 'vis_test_ace' });
        const user = await User.create({
            fullName: 'Ace Tester',
            username: 'vis_test_ace',
            phone: '01999999999',
            email: 'test_ace@example.com',
            password: 'hash',
            country: 'BD',
            taskData: { accountTier: 'Starter' },
            wallet: { game: 1000 }
        });

        console.log(`👤 User Created: ${user.username} | Balance: ${user.game_balance}`);

        // 2. Run Spin
        console.log("\n🎰 Spinning...");
        const result = await SuperAceService.spin(user._id, 10);

        // 3. Analyze Result
        console.log("✅ Spin Complete");
        console.log(`   Total Win: ${result.totalWin}`);
        console.log(`   Cascades: ${result.cascades.length}`);
        console.log(`   Final Balance: ${result.finalBalance}`);

        // 4. Check Grid Structure
        const grid = result.grid;
        const flatGrid = grid.flat();
        const hasGold = flatGrid.some(s => s.startsWith('GOLD_'));
        const hasWild = flatGrid.some(s => s === 'WILD');

        console.log("\n🔍 Grid Analysis:");
        console.log(`   Structure: ${grid.length} cols x ${grid[0].length} rows`);
        console.log(`   Has Golden Cards: ${hasGold ? 'YES' : 'NO'}`);
        console.log(`   Has Wild Cards: ${hasWild ? 'YES' : 'NO'}`);

        // 5. Check Cascade Data
        if (result.cascades.length > 0) {
            console.log("\n🌊 Cascade Detail (First Step):");
            const step1 = result.cascades[0];
            console.log(`   Win: ${step1.win}`);
            console.log(`   Multiplier: ${step1.multiplier}`);
            console.log(`   Matches: ${step1.matches.length}`);
        }

    } catch (err) {
        console.error("❌ Verification Failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifySuperAce();
