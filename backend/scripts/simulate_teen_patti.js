const mongoose = require('mongoose');
const TeenPattiService = require('../modules/game/TeenPattiService');
const User = require('../modules/user/UserModel');
const GameLogicService = require('../modules/game/GameLogicService');
const TeenPattiGame = require('../modules/game/TeenPattiGameModel'); // Added

// MongoDB Connection
const MONGO_URI = 'mongodb://127.0.0.1:27017/man2man_db';

const simulate = async () => {
    try {
        // Removed GamePoolModel require

        // ... (Inside simulate)

        const GameLog = require('../modules/game/GameLogModel'); // Added

        // ... (Inside simulate)

        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB.");

        // Seed GameLog to create a "Safe" Pool
        await GameLog.create({
            userId: new mongoose.Types.ObjectId(), // Random dummy user
            gameType: 'teen_patti',
            betAmount: 50000,
            payout: 0,
            result: 'loss',
            createdAt: new Date()
        });
        console.log("Seeded GameLog with 50k Loss to fill Pool.");

        // Create or Get Test User
        let user = await User.findOne({ username: 'sim_tester_tp' });
        if (!user) {
            user = await User.create({
                username: 'sim_tester_tp',
                fullName: 'Simulation Tester',
                phone: '01700000000',
                password: 'hashed_password_placeholder',
                country: 'BD',
                wallet: { game: 100000 },
                device_id: 'sim_device_tp',
                is_active: true
            });
            console.log("Created Test User.");
        } else {
            user.game_balance = 100000; // Reset Balance
            await user.save();
            console.log("Reset Test User Balance.");
        }

        console.log(`Starting Balance: ${user.game_balance}`);

        let wins = 0;
        let losses = 0;
        let totalTax = 0;

        for (let i = 1; i <= 100; i++) {
            // 1. Start Game
            const startState = await TeenPattiService.startGame(user._id, 'rookie'); // 10 BDT Boot
            const gameId = startState.gameId;

            // Turn 1: User Chal
            await TeenPattiService.playTurn(user._id, gameId, 'chal');

            // CHEAT: Force Win for even games
            if (i % 2 === 0) {
                await TeenPattiGame.updateOne(
                    { _id: gameId },
                    {
                        $set: {
                            "players.0.cards": [
                                { suit: 'S', rank: 'A', value: 14 },
                                { suit: 'H', rank: 'A', value: 14 },
                                { suit: 'D', rank: 'A', value: 14 }
                            ]
                        }
                    }
                );
                // console.log(`Rigged Game ${i} for User Win`);
            }

            // Turn 2: Show
            let finalState = await TeenPattiService.playTurn(user._id, gameId, 'show');

            if (finalState.state === 'FINISHED') {
                if (finalState.winnerId === 0) {
                    wins++;
                    // Calculate Tax manually to verify?
                    // We can't easily see tax in return object, but we can see balance change.
                } else {
                    losses++;
                }
            }
        }

        // Final Verify
        const finalUser = await User.findById(user._id);
        console.log(`\nSimulation Complete (100 Hands)`);
        console.log(`Wins: ${wins}, Losses: ${losses}`);
        console.log(`Final Balance: ${finalUser.wallet.game}`);
        console.log(`Net Change: ${finalUser.wallet.game - 100000}`);

        // Check logs for Commission
        const logs = await mongoose.connection.db.collection('gamelogs').find({
            userId: user._id,
            gameType: 'teen_patti',
            result: 'win'
        }).toArray();

        let loggedCommission = 0;
        logs.forEach(l => loggedCommission += l.commission || 0);
        console.log(`Total Logged Commission (Tax): ৳${loggedCommission.toFixed(2)}`);

        process.exit(0);

    } catch (e) {
        console.error("Simulation Failed:", e);
        process.exit(1);
    }
};

simulate();
