require('dotenv').config();
const mongoose = require('mongoose');
const LotteryTemplate = require('../modules/game/LotteryTemplateModel');
const LotterySlot = require('../modules/game/LotterySlotModel');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man')
    .then(async () => {
        console.log('--- TEMPLATE CHECK ---');
        const templates = await LotteryTemplate.find({});
        console.log(`Found ${templates.length} templates.`);
        templates.forEach(t => {
            console.log(`- Tier: ${t.tier}, Active: ${t.isActive}, Duration: ${t.durationMinutes}m`);
        });

        console.log('\n--- STUCK SLOT CHECK ---');
        const stuck = await LotterySlot.find({ status: 'DRAWING' });
        if (stuck.length > 0) {
            console.log(`Found ${stuck.length} STUCK slots in DRAWING state!`);
            stuck.forEach(s => console.log(`  > ID: ${s._id}, Tier: ${s.tier}, EndTime: ${s.endTime}`));
        } else {
            console.log('No stuck slots found.');
        }

        console.log('\n--- ACTIVE SLOT CHECK ---');
        const active = await LotterySlot.find({ status: 'ACTIVE' });
        active.forEach(s => console.log(`  > ID: ${s._id}, Tier: ${s.tier}, EndTime: ${s.endTime}`));

        process.exit(0);
    })
    .catch(console.error);
