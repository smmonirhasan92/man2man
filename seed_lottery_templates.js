
const mongoose = require('mongoose');
const LotteryTemplate = require('./backend/modules/game/LotteryTemplateModel');
require('dotenv').config({ path: './backend/.env' });

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const templates = [
            { tier: '1M', durationMinutes: 1, isActive: true, prizes: [{ name: '1 Min Jackpot', amount: 500, winnersCount: 1 }], ticketPrice: 15, profitBuffer: 20 },
            { tier: '5M', durationMinutes: 5, isActive: true, prizes: [{ name: '5 Min Quick', amount: 1000, winnersCount: 1 }], ticketPrice: 25, profitBuffer: 20 },
            { tier: '15M', durationMinutes: 15, isActive: true, prizes: [{ name: '15 Min Power', amount: 2000, winnersCount: 1 }], ticketPrice: 30, profitBuffer: 20 },
            { tier: '30M', durationMinutes: 30, isActive: true, prizes: [{ name: '30 Min Super', amount: 3500, winnersCount: 1 }], ticketPrice: 35, profitBuffer: 20 },
            { tier: '60M', durationMinutes: 60, isActive: true, prizes: [{ name: 'Hourly Jackpot', amount: 5000, winnersCount: 1 }], ticketPrice: 45, profitBuffer: 20 },
            { tier: '3H', durationMinutes: 180, isActive: true, prizes: [{ name: '3 Hour Mega', amount: 12000, winnersCount: 1 }], ticketPrice: 55, profitBuffer: 20 },
            { tier: '6H', durationMinutes: 360, isActive: true, prizes: [{ name: '6 Hour Giga', amount: 25000, winnersCount: 1 }], ticketPrice: 75, profitBuffer: 20 },
            { tier: '12H', durationMinutes: 720, isActive: true, prizes: [{ name: '12 Hour Royal', amount: 50000, winnersCount: 1 }], ticketPrice: 85, profitBuffer: 20 },
            { tier: '24H', durationMinutes: 1440, isActive: true, prizes: [{ name: 'Daily Grand', amount: 100000, winnersCount: 1 }], ticketPrice: 120, profitBuffer: 20 },
            { tier: '7D', durationMinutes: 10080, isActive: true, prizes: [{ name: 'Weekly Wealth', amount: 500000, winnersCount: 1 }], ticketPrice: 240, profitBuffer: 20 }
        ];

        // Clear old legacy tiers (FLASH, HOURLY, MEGA, INSTANT) to avoid clutter? 
        // Or just upsert new ones. User said "Update". 
        // I will upsert.

        for (const t of templates) {
            await LotteryTemplate.findOneAndUpdate(
                { tier: t.tier },
                { ...t, lockDrawUntilTargetMet: true }, // Ensure lock is on
                { upsert: true, new: true }
            );
            console.log(`Seeded Template: ${t.tier}`);
        }

        console.log('Seeding Complete');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedTemplates();
