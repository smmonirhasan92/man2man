const mongoose = require('mongoose');
const LotteryService = require('./modules/game/LotteryService');
const User = require('./modules/user/UserModel');
const Transaction = require('./modules/wallet/TransactionModel');
// We need to polyfill process.env if not loaded, but assuming default localhost
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        const LotteryTemplate = require('./modules/game/LotteryTemplateModel');

        // 1. SEED TEMPLATES & CREATE SLOTS
        console.log("🎰 Seeding Templates & Creating Slots...");
        await LotteryTemplate.deleteMany({});

        const config = [
            { tier: 'FLASH', duration: 30, prize: 500, label: '30 MINS DRAW' },
            { tier: 'HOURLY', duration: 180, prize: 2000, label: '3 HOURS JACKPOT' }, // User requested 3 HOURS for "Hourly"
            { tier: 'MEGA', duration: 300, prize: 5000, label: '5 HOURS MEGA' },
            { tier: 'INSTANT', duration: 1440, prize: 1000, label: 'DAILY INSTANT' } // 24 Hours
        ];

        for (const cfg of config) {
            // Create Template for Auto-Restart
            await LotteryTemplate.create({
                tier: cfg.tier,
                isActive: true,
                durationMinutes: cfg.duration,
                profitMultiplier: 5,
                prizes: [{ name: 'Grand Jackpot', amount: cfg.prize, winnersCount: 1 }]
            });

            // Create Active Slot
            // Note: LotteryService.createSlot(data, multiplier, tier, durationMinutes)
            await LotteryService.createSlot(cfg.prize, 5, cfg.tier, cfg.duration);
            console.log(`   - Created ${cfg.tier} Slot (${cfg.duration} mins)`);
        }

        // 2. CREATE BOTS & FUND
        console.log("🤖 Initializing Bots...");
        const bots = [];
        for (let i = 1; i <= 5; i++) {
            const username = `bot_${i}_${Date.now()}`;
            const email = `${username}@test.com`;
            // Check if exists or create
            let user = await User.create({
                username,
                email,
                password: 'password123',
                fullName: `Bot User ${i}`,
                primary_phone: `+1${Date.now()}${i}`,
                country: 'USA',
                wallet: { main: 5000, game: 0 }
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
                try {
                    await LotteryService.buyTicket(bot._id, 3, slot.slotId);
                    process.stdout.write(".");
                } catch (err) {
                    process.stdout.write("x");
                    // console.error(err.message);
                }
            }
            console.log(" Done.");
        }

        console.log("\n✅ Stress Test Setup Complete. Slots populated.");
        process.exit(0);

    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

main();
