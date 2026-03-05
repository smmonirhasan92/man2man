require('dotenv').config({ path: '/var/www/man2man/backend/.env' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const P2PService = require('./modules/p2p/P2PService');
    try {
        const stats = await P2PService.getMarketSummary();
        console.log("==> P2P SERVICE RETURN PAYLOAD:");
        console.log(JSON.stringify(stats, null, 2));
    } catch (e) {
        console.log("==> ERROR:", e);
    }
    process.exit(0);
});
