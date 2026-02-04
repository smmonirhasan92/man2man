const mongoose = require('mongoose');
const LotteryService = require('../modules/game/LotteryService');
const LotterySlot = require('../modules/game/LotterySlotModel');
require('dotenv').config();

const SLOTS_CONFIG = [
    { tier: 'STARTER', price: 10, color: 'blue', label: 'Starter' },
    { tier: 'BASIC', price: 20, color: 'emerald', label: 'Basic' },
    { tier: 'BRONZE', price: 30, color: 'amber', label: 'Bronze' },
    { tier: 'SILVER', price: 40, color: 'slate', label: 'Silver' },
    { tier: 'GOLD', price: 50, color: 'yellow', label: 'Gold' },
    { tier: 'PLATINUM', price: 80, color: 'cyan', label: 'Platinum' },
    { tier: 'DIAMOND', price: 120, color: 'purple', label: 'Diamond' }
];

async function seed() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');

        console.log("Clearing Existing Active Slots...");
        await LotterySlot.deleteMany({ status: { $in: ['ACTIVE', 'DRAWING'] } });

        for (const cfg of SLOTS_CONFIG) {
            console.log(`Creating Slot: ${cfg.tier} @ ${cfg.price} TK`);

            // Prize Structure: 1 Winner gets 50x price (Jackpot)
            const jackpotAmount = cfg.price * 50;
            const prizes = [
                { name: `${cfg.label} Jackpot`, amount: jackpotAmount, winnersCount: 1 }
            ];

            // Create Slot
            await LotteryService.createSlot({
                prizes: prizes,
                description: `${cfg.label} Tier Lottery - Win ${jackpotAmount} TK!`,
                profitBuffer: 20, // 20% profit margin
                ticketPrice: cfg.price,
                lockDrawUntilTargetMet: true // Wait for sales
            }, 1.2, cfg.tier);
        }

        console.log("✅ 7 Slots Created Successfully.");
        process.exit(0);

    } catch (e) {
        console.error("Seed Error:", e);
        process.exit(1);
    }
}

seed();
