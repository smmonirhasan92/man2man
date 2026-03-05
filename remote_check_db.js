require('dotenv').config({ path: '/var/www/man2man/backend/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const SystemSetting = require('./modules/settings/SystemSettingModel');
    try {
        const min = await SystemSetting.findOne({ key: 'p2p_market_min' });
        const max = await SystemSetting.findOne({ key: 'p2p_market_max' });
        const usd_bdt = await SystemSetting.findOne({ key: 'usd_to_bdt_rate' });
        console.log("==> SETTINGS IN DB:");
        console.log("MIN:", min ? min.value : 'NOT SET');
        console.log("MAX:", max ? max.value : 'NOT SET');
        console.log("USD_BDT:", usd_bdt ? usd_bdt.value : 'NOT SET');
    } catch (e) {
        console.log("==> ERROR:", e);
    }
    process.exit(0);
});
