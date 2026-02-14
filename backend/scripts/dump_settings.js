const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SystemSetting = require('../modules/settings/SystemSettingModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listSettings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const settings = await SystemSetting.find({});
        console.log("\n--- SYSTEM SETTINGS ---");
        settings.forEach(s => {
            console.log(`Key: ${s.key} | Value: ${JSON.stringify(s.value)}`);
        });
        console.log("-----------------------\n");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

listSettings();
