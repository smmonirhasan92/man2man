const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const P2PService = require('../modules/p2p/P2PService');
const P2PTrade = require('../modules/p2p/P2PTradeModel');

const run = async () => {
    try {
        await connectDB();

        // Find the trade we just made
        const trade = await P2PTrade.findOne({ status: 'AWAITING_ADMIN' });
        if (!trade) throw new Error("No pending trade found");

        console.log(`[TEST] Approving Trade ${trade._id}...`);

        // Execute Approval
        const result = await P2PService.adminApproveRelease('ADMIN_ID', trade._id);

        console.log(`[SUCCESS] Trade Status: ${result.status}`);
        console.log(`[SUCCESS] Fee Deducted: ${result.fee}`);
        console.log(`[SUCCESS] Buyer Funds Released.`);

        process.exit(0);
    } catch (e) {
        console.error("[ERROR]", e.message);
        process.exit(1);
    }
};
run();
