const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const LotterySlot = require('./modules/lottery/LotterySlotModel');

async function cleanLottery() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core';
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB: " + mongoUri);

        const result = await LotterySlot.deleteMany({ status: { $in: ['ACTIVE', 'DRAWING'] } });
        console.log(`Deleted ${result.deletedCount} active lottery slots.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanLottery();
