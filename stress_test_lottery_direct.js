const axios = require('axios');
const API_URL = 'http://localhost:5050/api';

async function runStressTest() {
    console.log("🚀 STARTING LOTTERY STRESS TEST...");

    // 1. LOGIN ADMIN (Using hardcoded demo admin or creating one? Assuming demo/demo works or I can bypass if I use a known token. 
    // I don't have a token handy. Let's assume standard login flow.)
    // Actually, I can't easily login without a valid user in DB.
    // I will try to use a known endpoint or just create a user.
    // Let's use the 'register' endpoint to create a fresh admin/user? No, admin requires DB access.
    // I will use `npm run register` logic? No.
    // I'll grab a token from the `add_test_funds.js` or similar if available?
    // Let's just create a new user and upgrade them if needed, OR just trust that I can hit the endpoint if I disable auth middleware? No that's cheating.
    // Wait, the USER's terminal has `curl` commands running. I can see if there is any auth token being used? No.
    // I will try to login as 'admin' '123456' (Common default). If fails, I'll register a new user 'StressBot' and use them (but they can't create slots).
    // Actually, I can use the Create Slot endpoint if I bypass middleware locally? No.
    // Best bet: use the existing running backend processing.
    // I will try to register 'adminTest' and then database-force them to admin? 
    // I have `backend/modules/game/LotteryService.js` open. I can import it in a script and run direct calls!
    // YES. Running a script that imports `LotteryService` directly is faster and bypasses Auth Middleware needs for testing logic.
    // But User asked for "Terminal/Console Verification" which implies observing the logs.

    // METHOD: Direct Service Calls via a script executed with `node`.
    // I need to connect DB first.
}

// I will write a script that connects to Mongoose and uses LotteryService directly.
const mongoose = require('mongoose');
const LotteryService = require('./backend/modules/game/LotteryService');
const User = require('./backend/user/UserModel');
const Transaction = require('./backend/wallet/TransactionModel');

// Environment
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        // 1. CREATE SLOTS
        console.log("🎰 Creating Slots...");
        const tiers = ['FLASH', 'HOURLY', 'MEGA', 'INSTANT'];
        for (const tier of tiers) {
            // Create 2 slots for each (Actually createSlot archives old ones, so only 1 active per tier usually?)
            // The service says: "Archive valid slots ONLY of this tier". So yes, only 1 active per tier.
            // User asked: "Create 2 slots for each". This might conflict with logic. 
            // I will create 1 active for each, and maybe one acts as "next"?
            // I'll just create 1 FRESH one for each tier to ensure they exist.
            await LotteryService.createSlot(1000, 5, tier, 60); // 1000 Prize, 5x Multiplier, 60m duration
            console.log(`   - Created ${tier} Slot`);
        }

        // 2. CREATE BOTS & FUND
        console.log("🤖 Initializing Bots...");
        const bots = [];
        for (let i = 1; i <= 5; i++) {
            const username = `bot_${i}_${Date.now()}`;
            // Create user directly
            let user = await User.create({
                username,
                email: `${username}@test.com`,
                password: 'password123',
                wallet: { main: 5000, game: 0 } // Give 5000 funds
            });
            bots.push(user);
            console.log(`   - Bot ${username} Ready (5000 BDT)`);
        }

        // 3. EXECUTE BIDS
        console.log("🎟️ Placing Bids...");
        const activeSlots = await LotteryService.getActiveSlots();
        for (const slot of activeSlots) {
            console.log(`   > Bidding on ${slot.tier} (Slot ${slot.slotId})`);
            for (const bot of bots) {
                // Buy 3 tickets each
                await LotteryService.buyTicket(bot._id, 3, slot.slotId);
                process.stdout.write(".");
            }
            console.log(" Done.");
        }

        console.log("\n✅ Stress Test Setup Complete. ");
        console.log("   Check Admin Panel to see populated slots.");
        console.log("   Manually Trigger 'Force Draw' as requested.");

        process.exit(0);

    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

main();
