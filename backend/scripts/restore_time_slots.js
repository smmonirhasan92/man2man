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
        await LotteryTemplate.deleteMany({}); // Clear old templates

        console.log("Creating new configurations...");

        const configs = [
            // 10 BDT: 1-Minute AND 30-Minute
            { price: 10, duration: 1, label: '10 BDT (1 Min)', tier: 'TIER_10_1M' },
            { price: 10, duration: 30, label: '10 BDT (30 Mins)', tier: 'TIER_10_30M' },

            // 20 BDT: 1-Hour
            { price: 20, duration: 60, label: '20 BDT (1 Hour)', tier: 'TIER_20' },

            // 30 BDT: Map to 1-Hour (Gap fix)
            { price: 30, duration: 60, label: '30 BDT (1 Hour)', tier: 'TIER_30' },

            // 40-50 BDT: 6-Hour and 12-Hour
            { price: 40, duration: 360, label: '40 BDT (6 Hours)', tier: 'TIER_40' },
            { price: 50, duration: 720, label: '50 BDT (12 Hours)', tier: 'TIER_50' },

            // 60-70 BDT: Map to 12-Hour (Gap fix)
            { price: 60, duration: 720, label: '60 BDT (12 Hours)', tier: 'TIER_60' },
            { price: 70, duration: 720, label: '70 BDT (12 Hours)', tier: 'TIER_70' },

            // 80-120 BDT: 24-Hour
            { price: 80, duration: 1440, label: '80 BDT (Daily)', tier: 'TIER_80' },
            { price: 90, duration: 1440, label: '90 BDT (Daily)', tier: 'TIER_90' },
            { price: 100, duration: 1440, label: '100 BDT (Daily)', tier: 'TIER_100' },
            { price: 110, duration: 1440, label: '110 BDT (Daily)', tier: 'TIER_110' },
            { price: 120, duration: 1440, label: '120 BDT (Daily)', tier: 'TIER_120' },

            // Premium: Weekly/Monthly
            { price: 200, duration: 10080, label: '200 BDT (Weekly)', tier: 'TIER_WEEKLY' },
            { price: 500, duration: 43200, label: '500 BDT (Monthly)', tier: 'TIER_MONTHLY' },
        ];

        for (const cfg of configs) {
            const jackpot = cfg.price * 50; // Standard 50x multiplier

            // 1. Create Template for Auto-Restoration
            await LotteryTemplate.create({
                tier: cfg.tier,
                isActive: true,
                durationMinutes: cfg.duration,
                profitMultiplier: 1.2, // 20% buffer default
                prizes: [{ name: 'Grand Jackpot', amount: jackpot, winnersCount: 1 }],
                ticketPrice: cfg.price,
                // store label if schema supports or just use tier
            });

            // 2. Create Instant Initial Slot
            const slotData = {
                prizes: [{ name: 'Grand Jackpot', amount: jackpot, winnersCount: 1 }],
                ticketPrice: cfg.price,
                description: cfg.label,
                profitBuffer: 20
            };

            await LotteryService.createSlot(slotData, 1.2, cfg.tier, cfg.duration);
            console.log(`✅ Created ${cfg.label} [${cfg.tier}]`);
        }

        console.log("System Time-Slot Architecture Restored.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

main();
