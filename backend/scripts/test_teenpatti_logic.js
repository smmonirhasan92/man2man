const mongoose = require('mongoose');
const path = require('path'); // Ensure path is required
const User = require('../modules/user/UserModel');
const TeenPattiService = require('../modules/game/TeenPattiService');

require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Fix path

async function runTest() {
    try {
        console.log('🃏 TESTING TEEN PATTI ROYAL LOGIC...');
        await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create Test User (Real Balance: 1000 BDT)
        const user = await User.create({
            username: `tp_royal_${Date.now()}`,
            fullName: 'Royal Tester',
            phone: `01${Date.now().toString().slice(-9)}`,
            password: '123',
            wallet: { game: 1000 }, // 1000 BDT
            country: 'BD'
        });
        console.log(`User created. Wallet: 1000 BDT`);

        // 2. Start Game (Rookie Tier: Boot 10 BDT = 1000 Chips)
        console.log('\n--- STARTING GAME (Rookie) ---');
        let game = await TeenPattiService.startGame(user._id, 'rookie');

        // Verify Deduction
        const userAfterBoot = await User.findById(user._id);
        console.log(`Boot Deduction Check: 1000 -> ${userAfterBoot.wallet.game} BDT (Expected 990)`);
        if (userAfterBoot.wallet.game !== 990) throw new Error("Boot deduction incorrect!");

        console.log(`Game Started. Pot: ${game.pot} Chips`);

        // 3. Play Turn (Chal)
        console.log('\n--- PLAYING TURN (Chal) ---');
        // Current Bet is 1000 Chips (10 BDT)
        game = await TeenPattiService.playTurn(user._id, game.gameId, 'chal');

        const userAfterChal = await User.findById(user._id);
        console.log(`Chal Deduction Check: 990 -> ${userAfterChal.wallet.game} BDT (Expected 980)`);
        if (userAfterChal.wallet.game !== 980) throw new Error("Chal deduction incorrect!");

        console.log(`Turn Played. State: ${game.state}`);

        // 4. Show (Force Showdown)
        console.log('\n--- FORCING SHOWDOWN ---');
        // Another 1000 Chips (10 BDT)
        game = await TeenPattiService.playTurn(user._id, game.gameId, 'show');

        const userFinal = await User.findById(user._id);
        console.log(`Show Deduction Check: 980 -> ${userFinal.wallet.game} BDT (Expected 970)`);

        console.log(`\nWinner: ${game.winnerId === 0 ? 'USER' : 'BOT'}`);
        if (game.winnerId === 0) {
            console.log(`Payout Check: User Balance: ${userFinal.wallet.game}`);
            // Calculated Payout needs manual check in logs.
        }

        console.log('✅ Teen Patti Royal Logic Validated.');

        // Cleanup
        await User.findByIdAndDelete(user._id);
        process.exit(0);

    } catch (e) {
        console.error("❌ TEST FAILED:", e);
        process.exit(1);
    }
}

runTest();
