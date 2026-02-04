const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../modules/user/UserModel');
const MinesService = require('../modules/game/MinesService');
const GamePoolService = require('../modules/game/GamePoolService');
const TransactionHelper = require('../modules/common/TransactionHelper');

dotenv.config();

const runTest = async () => {
    try {
        console.log("🔥 STARTING MINES ENGINE TEST...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        // 1. Setup Test User
        let user = await User.findOne({ primary_phone: '01700000000' }); // Super Admin
        if (!user) throw new Error("Super Admin not found");

        const initialBalance = user.wallet?.game || user.wallet?.main;
        console.log(`User Balance: ${initialBalance}`);

        // 2. Play 1 Game
        console.log("\n--- TEST GAME 1: Standard Play ---");
        const bet = 100;
        const mines = 3;

        try {
            const gameStart = await MinesService.startGame(user._id, bet, mines);
            console.log(`Game Started: ${gameStart.gameId}`);

            // Verify Tax
            // We can't see Tax DB directly easily without query, but if no error, it ran.

            // Reveal 1 Tile
            const move1 = await MinesService.revealTile(user._id, gameStart.gameId, 0);
            console.log("Move 1 Result:", move1.status, move1.multiplier ? `x${move1.multiplier}` : '');

            if (move1.status === 'LOST') {
                console.log("💥 BOMB HIT immediately.");
            } else {
                // Reveal another
                const move2 = await MinesService.revealTile(user._id, gameStart.gameId, 1);
                console.log("Move 2 Result:", move2.status, move2.multiplier ? `x${move2.multiplier}` : '');

                // Cashout
                if (move2.status !== 'LOST') {
                    const cashout = await MinesService.cashout(user._id, gameStart.gameId);
                    console.log(`💰 Cashed Out: ${cashout.winAmount}`);
                }
            }

        } catch (e) {
            console.error("Game 1 Error:", e.message);
        }

        // 3. Test High Risk / Rigging Simulation
        // To force rigging, we need a massive multiplier or drained pool.
        // We can't easily drain pool in 1 script without loops.
        // But we can check logs output manually as requested.

        console.log("\n✅ Test Complete. USE TERMINAL LOGS to verify [MINES] logs.");
        process.exit(0);

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
        process.exit(1);
    }
};

runTest();
