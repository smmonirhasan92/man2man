const mongoose = require('mongoose');
const SystemSetting = require('./modules/settings/SystemSettingModel');

async function checkSettings() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB:', mongoose.connection.db.databaseName);

    const allSettings = await SystemSetting.find({});
    console.log('\n=== ALL SYSTEM SETTINGS ===');
    for (const s of allSettings) {
        console.log(`[${s.category || 'N/A'}] ${s.key} = ${JSON.stringify(s.value)}`);
    }

    process.exit(0);
}

checkSettings().catch(e => { console.error(e); process.exit(1); });
