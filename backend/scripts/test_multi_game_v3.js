const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const UniversalMatchMaker = require('../modules/gamification/UniversalMatchMaker');

const MONGO_URI = 'mongodb://localhost:27017/universal_game_core_v1';

async function runMultiGameSim() {
    try {
        console.log('--- UNIVERSAL ENGINE V3 RAPID SIMULATION (60 TOTAL ROUNDS) ---');
        await mongoose.connect(MONGO_URI);

        const testUser = await User.findOne({ username: 'sim_user_1' }) || await User.create({
            fullName: 'Sim User 1', username: 'sim_user_1', primary_phone: '11111111', 
            password: 'password123', wallet: { main: 10000 }, gameStats: { totalGamesPlayed: 20 }
        });

        const games = [
            { name: 'SPIN (Bronze)', type: 'spin', bet: 1, mults: { rank1: 4.0, rank2: 1.5, rank3: 0 } },
            { name: 'SCRATCH (Silver)', type: 'scratch', bet: 2.5, mults: { rank1: 3.5, rank2: 1.8, rank3: 0 } },
            { name: 'GIFT BOX (Gold)', type: 'gift', bet: 10, mults: { rank1: 5.0, rank2: 2.0, rank3: 0.5 } }
        ];

        for (const game of games) {
            console.log(`\nTesting ${game.name}... (Simultaneous Pairs)`);
            let totalBet = 0;
            let totalPayout = 0;
            let totalAdmin = 0;
            let wins = 0;

            const batch = [];
            for (let i = 0; i < 20; i++) {
                batch.push(UniversalMatchMaker.processMatch(testUser._id, game.bet, game.type, game.mults));
            }

            const results = await Promise.all(batch);

            results.forEach(res => {
                totalBet += game.bet;
                totalPayout += res.payout;
                totalAdmin += res.adminCommission;
                if (res.isWin) wins++;
            });

            console.log(`- Win Frequency: ${((wins/20)*100).toFixed(2)}%`);
            console.log(`- Total User ROI: ${((totalPayout / totalBet) * 100).toFixed(2)}%`);
            console.log(`- Admin Margin: ${((totalAdmin / totalBet) * 100).toFixed(2)}%`);
        }

        console.log('\nFinal Report Generated Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Simulation Failed:', err);
        process.exit(1);
    }
}

runMultiGameSim();
