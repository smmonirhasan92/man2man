const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load Env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man';

const SystemSetting = require('../backend/modules/settings/SystemSettingModel');

async function seed() {
    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log('✅ Connected to DB');

        // Seed Profit Target
        await SystemSetting.findOneAndUpdate(
            { key: 'global_profit_target' },
            {
                key: 'global_profit_target',
                value: '30',
                category: 'global',
                description: 'Global Profit Margin % for House (Profit Guard)'
            },
            { upsert: true, new: true }
        );

        console.log('✅ global_profit_target set to 30%');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
