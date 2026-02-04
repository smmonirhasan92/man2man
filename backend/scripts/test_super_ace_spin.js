const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../modules/user/UserModel');

// Config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyremitwallet123';

async function testSpin() {
    try {
        console.log("1. Connecting to DB...");
        await mongoose.connect(MONGO_URI);

        console.log("2. Ensuring Test User...");
        const phone = '01999999999';
        let user = await User.findOne({ primary_phone: phone });

        if (!user) {
            console.log("   Creating new user...");
            user = await User.create({
                fullName: 'Spin Tester',
                username: 'spintester',
                primary_phone: phone,
                password: 'hashedpasswordplaceholder',
                country: 'Bangladesh',
                role: 'user',
                wallet: { main: 0, game: 0, income: 0 }
            });
        }

        console.log(`3. Funding User (Current: ${user.game_balance})...`);
        user.game_balance = 5000;
        user.wallet.game = 5000;
        await user.save();
        console.log(`   Funds Injected via MongoDB. Balance: ${user.wallet.game}`);

        console.log("4. Generating Token...");
        const token = jwt.sign({ user: { id: user._id, role: user.role } }, JWT_SECRET, { expiresIn: '1h' });

        console.log("5. Executing API Spin (Bet: 1 BDT)...");
        const spinRes = await axios.post('http://localhost:5050/api/game/super-ace/spin',
            { betAmount: 1 },
            { headers: { 'x-auth-token': token } }
        );

        console.log("\n--- [SUCCESS] SPIN RESULT ---");
        console.log("Total Win:", spinRes.data.totalWin);
        console.log("Final Balance:", spinRes.data.finalBalance);
        console.log("Grid Size:", spinRes.data.grid.length, "x", spinRes.data.grid[0].length);
        console.log("-----------------------------\n");

        process.exit(0);

    } catch (err) {
        console.error("\n[TEST FAILED]");
        console.error("Message:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        }
        process.exit(1);
    }
}

testSpin();
