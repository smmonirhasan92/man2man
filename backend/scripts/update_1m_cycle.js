require('dotenv').config();
const mongoose = require('mongoose');
const LotteryTemplate = require('../modules/game/LotteryTemplateModel');
const LotterySlot = require('../modules/game/LotterySlotModel');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man')
    .then(async () => {
        console.log('✅ Connected');

        const tiers = ['TIER_1M', 'TIER_3M'];

        for (const tier of tiers) {
            // Update Template Duration to 3 minutes
            await LotteryTemplate.updateMany(
                { tier: tier },
                { $set: { durationMinutes: 3, isActive: true } }
            );
            console.log(`Updated Template for ${tier} to 3 minutes.`);

            // Delete existing active slots to force recreation with new duration
            await LotterySlot.deleteMany({ tier: tier, status: { $in: ['ACTIVE', 'DRAWING'] } });
            console.log(`Cleared active slots for ${tier}.`);
        }

        console.log('Done.');
        process.exit(0);
    })
    .catch(console.error);
