const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGO_URI) dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function test() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri, { family: 4 });
        console.log('Connected.');

        console.log('Importing SystemSettingModel...');
        // Correct path from root d:\man2man
        const SystemSetting = require('./backend/modules/settings/SystemSettingModel');
        console.log('Model Imported:', SystemSetting);

        console.log('Querying...');
        const bkash = await SystemSetting.findOne({ key: 'bkash_number' });
        console.log('Bkash Result:', bkash);

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e);
        process.exit(1);
    }
}

test();
