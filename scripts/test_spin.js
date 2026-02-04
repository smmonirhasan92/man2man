const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man';

const User = require('../backend/modules/user/UserModel');
// Note: using the active directory now
const SuperAceService = require('../backend/modules/game/SuperAceService');

async function testSpin() {
    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log('✅ Connected to DB');

        const user = await User.findOne({ primary_phone: '01700000000' });
        if (!user) throw new Error("User not found");

        console.log(`Initial Game Balance: ${user.wallet.game}`);

        // Ensure balance
        if ((user.wallet.game || 0) < 10) {
            console.log('Adding test balance...');
            user.wallet.game = (user.wallet.game || 0) + 1000;
            await user.save();
        }

        console.log('🎰 Spinning Super Ace (Bet: 10 BDT)...');
        try {
            const result = await SuperAceService.spin(user._id.toString(), 10.0);

            console.log('✅ Spin Complete!');
            console.log(`   - Win: ${result.totalWin}`);
            console.log(`   - Balance After: ${result.finalBalance}`);
            console.log(`   - Cascades: ${result.cascades.length}`);

            // Check for Profit Guard logs in output implies it ran

        } catch (e) {
            console.error('❌ Spin Failed:', e.message);
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testSpin();
