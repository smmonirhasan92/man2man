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

        console.log("Creating V4 Configuration (3M Cycle + Multi-Prize)...");

        // Helper to generate Prize Tiers (50%, 20%, 15%, 10%, 5%)
        // Total Pool is roughly Price * 50 (Jackpot Base)
        function generatePrizes(totalPool) {
            return [
                { name: '1st Prize', amount: Math.floor(totalPool * 0.50), winnersCount: 1 },
                { name: '2nd Prize', amount: Math.floor(totalPool * 0.20), winnersCount: 1 },
                { name: '3rd Prize', amount: Math.floor(totalPool * 0.15), winnersCount: 1 },
                { name: '4th Prize', amount: Math.floor(totalPool * 0.10), winnersCount: 1 },
                { name: '5th Prize', amount: Math.floor(totalPool * 0.05), winnersCount: 1 }
            ];
        }

        const configs = [
            // REPLACED 1M with 3M (25 BDT)
            { price: 25, duration: 3, label: '1 MINUTE DRAW', basePool: 2500, tier: 'TIER_3M' },

            { price: 20, duration: 30, label: '30 MINUTE DRAW', basePool: 1000, tier: 'TIER_30M' },
            { price: 30, duration: 60, label: 'HOURLY DRAW', basePool: 1500, tier: 'TIER_1H' },

            // Higher tiers
            { price: 40, duration: 360, label: '6 HOUR DRAW', basePool: 5000, tier: 'TIER_6H' },
            { price: 50, duration: 720, label: '12 HOUR DRAW', basePool: 10000, tier: 'TIER_12H' },
            { price: 80, duration: 1440, label: 'DAILY JACKPOT', basePool: 20000, tier: 'TIER_24H' },
            { price: 100, duration: 4320, label: '3 DAY SPECIAL', basePool: 50000, tier: 'TIER_3D' },
            { price: 120, duration: 10080, label: 'WEEKLY MEGA', basePool: 100000, tier: 'TIER_7D' },
        ];

        for (const cfg of configs) {
            const prizes = generatePrizes(cfg.basePool);

            // Template
            await LotteryTemplate.create({
                tier: cfg.tier,
                isActive: true,
                durationMinutes: cfg.duration,
                profitMultiplier: 1.2,
                prizes: prizes,
                ticketPrice: cfg.price
            });

            // Slot
            const slotData = {
                prizes: prizes,
                ticketPrice: cfg.price,
                description: cfg.label,
                profitBuffer: 20
            };

            await LotteryService.createSlot(slotData, 1.2, cfg.tier, cfg.duration);
            console.log(`✅ Created ${cfg.label} [${cfg.tier}] Price: ${cfg.price} Pool: ${cfg.basePool}`);
        }

        console.log("System Time-Slot V4 Restored (Multi-Prize Logic).");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

main();
