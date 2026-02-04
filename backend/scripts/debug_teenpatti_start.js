const mongoose = require('mongoose');
const TeenPattiService = require('../modules/game/TeenPattiService');
const User = require('../modules/user/UserModel');
const BotIdentity = require('../modules/game/BotIdentityModel');
require('dotenv').config({ path: '../.env' });

async function debugStart() {
    try {
        console.log('1. Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Get Admin
        console.log('2. Finding Admin...');
        const user = await User.findOne({ username: 'admin' });
        if (!user) {
            console.log('❌ CRITICAL: Admin user not found');
            process.exit(1);
        }
        console.log(`✅ User Found: ${user.username}, Balance: ${user.game_balance}`);

        // 2. Check Bots
        console.log('3. Checking Bots...');
        try {
            const botCount = await BotIdentity.countDocuments();
            console.log(`✅ Bot Identity Count: ${botCount}`);
        } catch (e) {
            console.log('⚠️ Bot Count Failed:', e.message);
        }

        // 3. Attempt Start
        console.log('4. Calling startGame(rookie)...');
        try {
            const game = await TeenPattiService.startGame(user._id, 'rookie');
            console.log('✅ GAME STARTED SUCCESSFULLY!');
            console.log('Game ID:', game.gameId);
        } catch (err) {
            console.error('❌ Service Error Caught:', err.message);
            if (err.stack) console.error(err.stack);
        }

        console.log('5. Done.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Script Error:', e);
        process.exit(1);
    }
}
debugStart();
