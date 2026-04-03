const mongoose = require('mongoose');
const P2PService = require('./backend/modules/p2p/P2PService');
const P2PTrade = require('./backend/modules/p2p/P2PTradeModel');

async function testAutoCancel() {
    console.log("Connecting to local MongoDB...");
    await mongoose.connect('mongodb://127.0.0.1:27017/man2man', { authSource: 'admin' }).catch(() => {
        return mongoose.connect('mongodb://localhost:27017/man2man');
    });

    console.log("Connected.");

    // Check if there are any expired trades
    const expiredTrades = await P2PTrade.find({
        status: 'CREATED',
        expiresAt: { $lt: new Date() }
    });

    console.log(`Found ${expiredTrades.length} expired trades.`);

    if (expiredTrades.length > 0) {
        console.log("First expired trade:", expiredTrades[0]);
    }

    console.log("Running autoCancelExpiredTrades...");
    const count = await P2PService.autoCancelExpiredTrades();
    console.log(`Done. Cancelled ${count} trades.`);

    process.exit(0);
}

testAutoCancel().catch(console.error);
