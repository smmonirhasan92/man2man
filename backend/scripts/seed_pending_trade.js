const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');
const P2POrder = require('../modules/p2p/P2POrderModel');
const P2PTrade = require('../modules/p2p/P2PTradeModel');
const P2PService = require('../modules/p2p/P2PService');

const run = async () => {
    try {
        await connectDB();

        // 1. Get/Create Users
        let seller = await User.findOne({ email: 'seller@test.com' });
        if (!seller) seller = await User.create({ username: 'seller_test', email: 'seller@test.com', password: 'password', wallet: { main: 5000, escrow_locked: 0 } });

        let buyer = await User.findOne({ email: 'buyer@test.com' });
        if (!buyer) buyer = await User.create({ username: 'buyer_test', email: 'buyer@test.com', password: 'password', wallet: { main: 0 } });

        console.log(`[SEED] Seller: ${seller.username}, Buyer: ${buyer.username}`);

        // 2. Clear old test data for clean logs
        await P2POrder.deleteMany({ userId: seller._id });
        await P2PTrade.deleteMany({ sellerId: seller._id });

        // 3. Create Sell Order (Locks 1000 NXS)
        // Simulate P2PService.createSellOrder logic manually to skip auth context or use service if possible
        // Let's use service if we can mock transaction helper... direct DB is safer here

        // Lock Funds
        await User.findByIdAndUpdate(seller._id, { $inc: { 'wallet.main': -1000, 'wallet.escrow_locked': 1000 } });

        const order = await P2POrder.create({
            userId: seller._id,
            amount: 1000,
            paymentMethod: 'bkash',
            paymentDetails: '01700000000',
            status: 'AWAITING_ADMIN' // Simulate fast forward
        });

        const trade = await P2PTrade.create({
            orderId: order._id,
            sellerId: seller._id,
            buyerId: buyer._id,
            amount: 1000,
            status: 'AWAITING_ADMIN',
            paymentProofUrl: 'https://via.placeholder.com/150'
        });

        console.log(`[SEED] Created Trade ${trade._id} [AWAITING_ADMIN]. Funds Locked.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
run();
