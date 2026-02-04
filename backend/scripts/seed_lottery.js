const mongoose = require('mongoose');
const Lottery = require('../modules/lottery/LotteryModel');
require('dotenv').config({ path: '../.env.local' });
if (!process.env.MONGODB_URI) require('dotenv').config();

async function seedLottery() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check specifically for Referral Draw
        const exists = await Lottery.findOne({
            name: { $regex: /Referral Draw/i },
            status: 'active'
        });

        if (exists) {
            console.log('✅ "Referral Draw" already exists:', exists.name);
        } else {
            console.log('Creating "Weekly Referral Draw"...');
            const drawDate = new Date();
            drawDate.setDate(drawDate.getDate() + 7);

            await Lottery.create({
                name: 'Weekly Referral Draw',
                price: 20, // Lower price for referral bonus usage?
                prizePool: 10000,
                drawDate: drawDate,
                status: 'active',
                description: 'Exclusive Referral Draw! Win big.'
            });
            console.log('✅ Created "Weekly Referral Draw"');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.connection.close();
    }
}

seedLottery();
