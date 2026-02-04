const mongoose = require('mongoose');
const LotteryTemplate = require('../modules/game/LotteryTemplateModel');
const LotteryService = require('../modules/game/LotteryService');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function activateFlash() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Creating FLASH Template...");

        // 1. Configure Template
        const template = await LotteryTemplate.findOneAndUpdate(
            { tier: 'FLASH' },
            {
                tier: 'FLASH',
                isActive: true,
                durationMinutes: 1,
                profitMultiplier: 5,
                prizes: [{ name: 'Flash Jackpot', amount: 100, winnersCount: 1 }]
            },
            { upsert: true, new: true }
        );
        console.log("Template Activated:", template);

        // 2. Launch First Slot immediately
        console.log("Launching First Slot...");
        const slot = await LotteryService.createSlot(
            template.prizes,
            template.profitMultiplier,
            template.tier,
            template.durationMinutes
        );
        console.log("Flash Slot Created:", slot._id, "Ends:", slot.endTime);

        process.exit(0);
    } catch (e) {
        console.error("SCRIPT ERROR:", e.stack || e);
        process.exit(1);
    }
}

activateFlash();
