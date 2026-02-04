const mongoose = require('mongoose');
const path = require('path');
const User = require('../modules/user/UserModel');
const TeenPattiService = require('../modules/game/TeenPattiService');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runTest() {
    let connection = null;
    try {
        console.log('🃏 Testing Teen Patti Backend...');
        connection = await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create User
        const user = await User.create({
            username: `tp_test_${Date.now()}`,
            fullName: 'TP Tester',
            phone: `01${Date.now().toString().slice(-9)}`,
            password: '123',
            country: 'BD',
            wallet: { game: 1000 }
        });

        // 2. Start Game
        console.log('Starting Game...');
        let gameState = await TeenPattiService.startGame(user._id, 50);
        console.log(`Game Started. ID: ${gameState.gameId}, Pot: ${gameState.pot}`);

        // 3. Play Turn (Chal)
        console.log('User Actions: Chal...');
        gameState = await TeenPattiService.playTurn(user._id, gameState.gameId, 'chal');
        console.log(`State after Chal: ${gameState.state}, Pot: ${gameState.pot}`);

        // 4. Force Show (if possible, might need simulation of bots)
        // With current logic, turns pass back to user instantly.
        console.log('User Actions: Show...');
        gameState = await TeenPattiService.playTurn(user._id, gameState.gameId, 'show');
        console.log(`Final State: ${gameState.state}, Winner: ${gameState.winnerId}`);

        // Cleanup
        await User.findByIdAndDelete(user._id);
        console.log('✅ Teen Patti Test Complete.');

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        if (connection) await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
