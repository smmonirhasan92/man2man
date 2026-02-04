const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LotteryService = require('../modules/game/LotteryService');
const LotterySlot = require('../modules/game/LotterySlotModel');
const LotteryTemplate = require('../modules/game/LotteryTemplateModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI && process.env.MONGO_URI) process.env.MONGODB_URI = process.env.MONGO_URI;

async function main() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        console.log("🧹 Wiping active slots and templates...");
        await LotterySlot.deleteMany({ status: { $in: ['ACTIVE', 'DRAWING'] } });
        await LotteryTemplate.deleteMany({});

        console.log("Creating V2 Configuration...");

        // User Mapping:
        // 1m -> 10 BDT
        // 30m -> 20 BDT
        // 1h -> 30 BDT
        // 6h -> 40 BDT
        // 12h -> 50 BDT
        // 24h -> 80 BDT
        // 3d -> 100 BDT
        // 7d -> 120 BDT

        const configs = [
            { price: 10, duration: 1, label: '1 MINUTE DRAW', tier: 'TIER_1M' },
            { price: 20, duration: 30, label: '30 MINUTE DRAW', tier: 'TIER_30M' },
            { price: 30, duration: 60, label: 'HOURLY DRAW', tier: 'TIER_1H' },
            { price: 40, duration: 360, label: '6 HOUR DRAW', tier: 'TIER_6H' },
            { price: 50, duration: 720, label: '12 HOUR DRAW', tier: 'TIER_12H' },
            { price: 80, duration: 1440, label: 'DAILY JACKPOT', tier: 'TIER_24H' },
            { price: 100, duration: 4320, label: '3 DAY SPECIAL', tier: 'TIER_3D' },
            { price: 120, duration: 10080, label: 'WEEKLY MEGA', tier: 'TIER_7D' },
        ];

        for (const cfg of configs) {
            const jackpot = cfg.price * 50;

            // Template
            await LotteryTemplate.create({
                tier: cfg.tier,
                isActive: true,
                durationMinutes: cfg.duration,
                profitMultiplier: 1.2,
                prizes: [{ name: 'Grand Jackpot', amount: jackpot, winnersCount: 1 }],
                ticketPrice: cfg.price
            });

            // Slot
            const slotData = {
                prizes: [{ name: 'Grand Jackpot', amount: jackpot, winnersCount: 1 }],
                ticketPrice: cfg.price,
                description: cfg.label,
                profitBuffer: 20
            };

            await LotteryService.createSlot(slotData, 1.2, cfg.tier, cfg.duration);
            console.log(`✅ Created ${cfg.label} [${cfg.tier}] Price: ${cfg.price}`);
        }

        console.log("System Time-Slot V2 Restored.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

main();
