const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const P2POrder = require('./modules/p2p/P2POrderModel');

    console.log("Connected to DB");
    const allOrders = await P2POrder.find().sort({ createdAt: -1 });
    console.log("Total orders:", allOrders.length);
    console.log("Statuses:", allOrders.map(o => o.status));
    console.log("Details:");
    console.log(JSON.stringify(allOrders.slice(0, 5), null, 2));

    process.exit(0);
}).catch(console.error);
