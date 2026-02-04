const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const P2POrder = require('../modules/p2p/P2POrderModel');
const P2PTrade = require('../modules/p2p/P2PTradeModel');
const P2PMessage = require('../modules/p2p/P2PMessageModel');

const run = async () => {
    try {
        await connectDB();
        console.log("🧹 Cleaning P2P System Data...");

        const orders = await P2POrder.deleteMany({});
        console.log(`Deleted ${orders.deletedCount} Orders`);

        const trades = await P2PTrade.deleteMany({});
        console.log(`Deleted ${trades.deletedCount} Trades`);

        const msgs = await P2PMessage.deleteMany({});
        console.log(`Deleted ${msgs.deletedCount} Messages`);

        console.log("✅ P2P System Wiped & Ready for Production.");
        process.exit(0);
    } catch (e) {
        console.error("Error", e);
        process.exit(1);
    }
};
run();
