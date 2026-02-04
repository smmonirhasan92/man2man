const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LotteryService = require('../modules/game/LotteryService');
const LotterySlot = require('../modules/game/LotterySlotModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI && process.env.MONGO_URI) process.env.MONGODB_URI = process.env.MONGO_URI;

async function main() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ DB Connected");

        const missingPrices = [10, 20, 60, 70, 90, 100, 110];

        for (const price of missingPrices) {
            // Check if exists
            const exists = await LotterySlot.findOne({
                status: { $in: ['ACTIVE', 'DRAWING'] },
                ticketPrice: price
            });

            if (exists) {
                console.log(`Slot for ${price} BDT already exists.`);
                continue;
            }

            console.log(`Creating Slot for ${price} BDT...`);

            // Tier naming convention: "TIER_{PRICE}" for now to ensure uniqueness and clarity
            const tierName = `TIER_${price}`;

            // Standard prize logic: 50x ticket price for Jackpot? 
            // Existing: 30 -> 1500 (50x), 40 -> 2000 (50x). Matches.
            const jackpot = price * 50;

            const config = {
                prizes: [{ name: 'Grand Jackpot', amount: jackpot, winnersCount: 1 }],
                ticketPrice: price,
                description: `${price} BDT Draw`,
                profitBuffer: 20
            };

            await LotteryService.createSlot(config, 1.2, tierName, 1440); // 24h duration default
            console.log(`✅ Created ${tierName} with Price ${price} and Jackpot ${jackpot}`);
        }

        console.log("All missing slots processed.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

main();
