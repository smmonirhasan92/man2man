require('dotenv').config();
const mongoose = require('mongoose');
const LotterySlot = require('../modules/game/LotterySlotModel');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man')
    .then(async () => {
        console.log('--- DIAGNOSTIC START ---');
        const now = new Date();
        console.log(`Current Server Time: ${now.toISOString()}`);

        const slots = await LotterySlot.find({
            tier: { $in: ['TIER_1M', 'TIER_3M'] },
            status: { $in: ['ACTIVE', 'DRAWING'] }
        });

        if (slots.length === 0) {
            console.log('❌ NO ACTIVE SLOTS FOUND for TIER_1M or TIER_3M.');
        } else {
            slots.forEach(s => {
                console.log(`\nSlot ID: ${s._id}`);
                console.log(`Tier: ${s.tier}`);
                console.log(`Status: ${s.status}`);
                console.log(`Start Time: ${s.startTime.toISOString()}`);
                console.log(`End Time:   ${s.endTime.toISOString()}`);

                const timeLeft = s.endTime.getTime() - now.getTime();
                console.log(`Time Left (ms): ${timeLeft}`);
                console.log(`Time Left (sec): ${Math.floor(timeLeft / 1000)}`);

                const isLocked = timeLeft < 60000;
                console.log(`System Lock Status (< 60s): ${isLocked ? 'LOCKED 🔒' : 'OPEN 🟢'}`);
            });
        }
        console.log('--- DIAGNOSTIC END ---');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
