const mongoose = require('mongoose');
require('dotenv').config();

const TeenPattiService = require('../modules/game/TeenPattiService');
const User = require('../modules/user/UserModel');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find by Phone (Source of Truth)
        const user = await User.findOne({ primary_phone: '01700000000' });
        if (!user) throw new Error('No User Found with 01700000000');

        console.log(`User Found: ${user.username} (${user._id})`);
        console.log('Balance:', user.game_balance);

        if ((user.game_balance || 0) < 10) {
            console.log('Fixing Balance...');
            user.game_balance = 100000;
            await user.save();
            console.log('Balance Updated.');
        }

        // Call Start
        console.log('Starting Game...');
        const game = await TeenPattiService.startGame(user._id, 'rookie');
        console.log('✅ SUCCESS GameId:', game.gameId);

        process.exit(0);
    } catch (e) {
        console.log('FAIL:', e.message);
        if (e.stack) console.log(e.stack);
        process.exit(1);
    }
}
run();
