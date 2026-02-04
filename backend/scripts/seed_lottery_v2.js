const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas directly to avoid path issues if models aren't exported perfectly or just to be safe in script
// ACTUALLY, usually better to require the models if paths are known.
// Paths: ../modules/game/LotterySlotModel.js
const LotterySlot = require('../modules/game/LotterySlotModel');
const LotteryService = require('../modules/game/LotteryService');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        console.log("Connected to MongoDB");

        // 1. Clear Active Slots
        console.log("Clearing existing ACTIVE slots...");
        await LotterySlot.deleteMany({ status: { $in: ['ACTIVE', 'DRAWING'] } });

        // 2. Create Slots
        // User Request: 5-6 active slots. Pricing 10 BDT.. 120 BDT.
        // We interpreted "Pricing" as Ticket Price, so we need to ensure Service supports it.
        // Assuming I modify Service/Model in next step, I will seed assuming `ticketPrice` field exists.

        const configs = [
            {
                tier: 'FLASH',
                ticketPrice: 10,
                prizes: [{ name: 'Flash Win', amount: 500, winnersCount: 1 }],
                description: 'Quick 1m Draw. Ticket: 10 BDT',
                durationMinutes: 1
            },
            {
                tier: 'HOURLY',
                ticketPrice: 20,
                prizes: [{ name: 'Hourly Pot', amount: 1500, winnersCount: 3 }],
                description: 'Draws every hour. Ticket: 20 BDT',
                durationMinutes: 60
            },
            {
                tier: 'DAILY',
                ticketPrice: 50,
                prizes: [{ name: 'Daily Reward', amount: 5000, winnersCount: 1 }],
                description: 'Once a day. Ticket: 50 BDT',
                durationMinutes: 1440
            },
            {
                tier: 'MEGA',
                ticketPrice: 80,
                prizes: [
                    { name: 'Mega 1st', amount: 20000, winnersCount: 1 },
                    { name: 'Mega 2nd', amount: 5000, winnersCount: 2 }
                ],
                description: 'Big 6H Draw. Ticket: 80 BDT',
                durationMinutes: 360
            },
            {
                tier: 'INSTANT',
                ticketPrice: 120,
                prizes: [{ name: 'Instant Jackpot', amount: 100000, winnersCount: 1 }],
                description: 'Instant Result. Ticket: 120 BDT',
                durationMinutes: 0 // Instant/Target Based
            }
        ];

        for (const cfg of configs) {
            console.log(`Creating ${cfg.tier} Slot...`);
            // We use LotteryService to create, but strictly it might not support ticketPrice arg yet.
            // So we might need to manually create or update after creation.
            // 'createSlot' signature: createSlot(data, multiplier, tier, duration)
            // data can be object.

            const data = {
                prizes: cfg.prizes,
                description: cfg.description,
                profitBuffer: 20
            };

            const slot = await LotteryService.createSlot(data, cfg.profitMultiplier || 5, cfg.tier, cfg.durationMinutes || 0);

            // Manual Patch for ticketPrice (since createSlot might not handle it yet)
            slot.ticketPrice = cfg.ticketPrice;
            await slot.save();
            console.log(`> Created ${cfg.tier} with Ticket Price: ${slot.ticketPrice}`);
        }

        console.log("Seed Complete.");
        process.exit(0);

    } catch (err) {
        console.error("Seed Error:", err);
        process.exit(1);
    }
};

seedData();
