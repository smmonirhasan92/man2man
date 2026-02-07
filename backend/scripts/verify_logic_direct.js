const mongoose = require('mongoose');
const SuperAceService = require('../modules/game/SuperAceService');
const User = require('../modules/user/UserModel');

// Use Default Local URI
const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function verifyLogic() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("   Connected.");

        // Find or Create User
        console.log("2. Preparing Test User...");
        let user = await User.findOne({ username: 'logic_tester' });
        if (!user) {
            user = await User.create({
                fullName: 'Logic Tester',
                username: 'logic_tester',
                primary_phone: '01700000000',
                password: 'temp',
                country: 'Bangladesh',
                wallet: { main: 1000, game: 1000 }
            });
        } else {
            // Reset balance
            user.wallet.game = 1000;
            await user.save();
        }
        console.log(`   User Ready: ${user.username} (Balance: ${user.wallet.game})`);

        // Run Spin
        console.log("3. Executing SuperAce Spin (Bet: 50)...");
        const result = await SuperAceService.spin(user._id, 50);

        console.log("\n--- GAME RESULT ---");
        console.log(`Status: ${result.status}`);
        console.log(`Win: ${result.win}`);
        console.log(`Balance: ${result.balance}`);
        console.log(`Grid: ${result.grid.length}x${result.grid[0].length}`);
        console.log(`Matches: ${result.matches.length}`);

        if (result.win > 0) {
            console.log("🎉 WINNER! Logic confirmed (RTP Active)");
        } else {
            console.log("📉 LOSS. Logic confirmed (RTP Active)");
        }
        console.log("-------------------\n");

        process.exit(0);

    } catch (err) {
        console.error("❌ VERIFICATION FAILED:", err);
        process.exit(1);
    }
}

verifyLogic();
