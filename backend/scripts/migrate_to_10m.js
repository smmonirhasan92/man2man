require('dotenv').config();
const mongoose = require('mongoose');
const LotteryTemplate = require('../modules/game/LotteryTemplateModel');
const LotterySlot = require('../modules/game/LotterySlotModel');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man')
    .then(async () => {
        console.log('--- STARTING 10M MIGRATION ---');

        // 1. Deactivate Old Tiers
        const oldTiers = ['TIER_1M', 'TIER_3M'];
        await LotteryTemplate.updateMany(
            { tier: { $in: oldTiers } },
            { $set: { isActive: false } }
        );
        console.log('❌ Deactivated TIER_1M and TIER_3M Templates.');

        // 2. Delete Active Slots of Old Tiers (Cleanup)
        await LotterySlot.deleteMany({
            tier: { $in: oldTiers },
            status: { $in: ['ACTIVE', 'DRAWING'] }
        });
        console.log('🗑️ Deleted active slots for TIER_1M and TIER_3M.');

        // 3. Create/Enable TIER_10M Template
        const tier10m = 'TIER_10M';
        const existing = await LotteryTemplate.findOne({ tier: tier10m });

        const templateData = {
            tier: tier10m,
            isActive: true,
            durationMinutes: 10,
            prizes: [
                { name: 'Grand Prize', amount: 1250, winnersCount: 1 },
                { name: 'Minor Prize', amount: 125, winnersCount: 5 }
            ],
            profitMultiplier: 5, // Default
            description: '10 Minute Flash Draw'
        };

        if (existing) {
            await LotteryTemplate.updateOne({ tier: tier10m }, { $set: templateData });
            console.log('✅ Updated existing TIER_10M Template.');
        } else {
            await LotteryTemplate.create(templateData);
            console.log('✨ Created NEW TIER_10M Template.');
        }

        console.log('--- MIGRATION COMPLETE ---');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
