const mongoose = require('mongoose');
const path = require('path');
const User = require('../modules/user/UserModel');
const MinesService = require('../modules/game/MinesService');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runTest() {
    let connection = null;
    try {
        console.log('💣 Testing Mines Backend...');
        connection = await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create User
        const user = await User.create({
            username: `mines_test_${Date.now()}`,
            fullName: 'Mines Tester',
            phone: `01${Date.now().toString().slice(-9)}`,
            password: '123',
            country: 'BD',
            wallet: { game: 1000 }
        });

        // 2. Start Game
        console.log('Starting Game (3 Mines, 50 Bet)...');
        let game = await MinesService.startGame(user._id, 50, 3);
        console.log(`Game Started. ID: ${game.gameId}`);

        // 3. Reveal Tile 0
        console.log('Revealing Tile 0...');
        let revealResult = await MinesService.revealTile(user._id, game.gameId, 0);
        console.log(`Reveal Result: ${revealResult.state}, Multiplier: ${revealResult.multiplier}`);

        if (revealResult.state === 'WON' || revealResult.state === 'ACTIVE') {
            // 4. Cashout
            console.log('Cashing out...');
            const cashoutResult = await MinesService.cashout(user._id, game.gameId);
            console.log(`Cashout: ${cashoutResult.status}, Win: ${cashoutResult.winAmount}`);
        } else {
            console.log('Hit a mine on first try!');
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);
        console.log('✅ Mines Test Complete.');

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        if (connection) await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
