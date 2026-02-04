const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const P2PService = require('../modules/p2p/P2PService');
const P2POrder = require('../modules/p2p/P2POrderModel');
const P2PTrade = require('../modules/p2p/P2PTradeModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';

async function runVerification() {
    console.log("🚀 Starting P2P Verification...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    try {
        // 1. Setup Users
        const sellerPhone = "01999999999";
        const buyerPhone = "01888888888";

        await User.deleteMany({ primary_phone: { $in: [sellerPhone, buyerPhone] } });
        await P2POrder.deleteMany({});
        await P2PTrade.deleteMany({});

        const seller = await User.create({
            fullName: 'Seller Name',
            username: 'SellerUser',
            primary_phone: sellerPhone,
            country: 'BD',
            password: 'hashedpassword',
            wallet: { main: 1000, escrow_locked: 0 }
        });

        const buyer = await User.create({
            fullName: 'Buyer Name',
            username: 'BuyerUser',
            primary_phone: buyerPhone,
            country: 'BD',
            password: 'hashedpassword',
            wallet: { main: 500, escrow_locked: 0 } // Buyer has enough for p2p? No, buyer sends fiat, gets main.
        });

        console.log(`👤 Created Users: Seller (${seller._id}) and Buyer (${buyer._id})`);

        // 2. Create Sell Order (Seller wants to sell 500 BDT)
        console.log("\n--- STEP 1: CREATE SELL ORDER ---");
        const order = await P2PService.createSellOrder(seller._id, 500, 'bkash', '01700000000');
        console.log("✅ Order Created:", order._id);

        // Verify Locks
        const sellerAfterLock = await User.findById(seller._id);
        if (sellerAfterLock.wallet.main === 500 && sellerAfterLock.wallet.escrow_locked === 500) {
            console.log("✅ Seller Funds Locked Correctly: 500 Main, 500 Escrow");
        } else {
            console.error("❌ Seller Funds Lock FAILED:", sellerAfterLock.wallet);
            process.exit(1);
        }

        // 3. Initiate Trade (Buyer buys the order)
        console.log("\n--- STEP 2: INITIATE TRADE ---");
        const trade = await P2PService.initiateTrade(buyer._id, order._id);
        console.log("✅ Trade Started:", trade._id);

        const orderAfterTrade = await P2POrder.findById(order._id);
        if (orderAfterTrade.status === 'LOCKED') console.log("✅ Order Status is LOCKED");
        else console.error("❌ Order Status Error:", orderAfterTrade.status);

        // 4. Mark Paid
        console.log("\n--- STEP 3: MARK PAID ---");
        await P2PService.markPaid(buyer._id, trade._id, "proof.jpg");
        const tradePaid = await P2PTrade.findById(trade._id);
        if (tradePaid.status === 'PAID') console.log("✅ Trade Status is PAID");

        // 5. Confirm Release
        console.log("\n--- STEP 4: CONFIRM RELEASE ---");
        await P2PService.confirmRelease(seller._id, trade._id);

        // Final Checks
        const sellerFinal = await User.findById(seller._id);
        const buyerFinal = await User.findById(buyer._id);

        console.log("\n--- FINAL BALANCES ---");
        console.log(`Seller: Main ${sellerFinal.wallet.main} (Expected 500), Escrow ${sellerFinal.wallet.escrow_locked} (Expected 0)`);
        console.log(`Buyer: Main ${buyerFinal.wallet.main} (Expected 1000)`);

        if (sellerFinal.wallet.escrow_locked === 0 && buyerFinal.wallet.main === 1000) {
            console.log("🏆 SUPER SUCCESS: P2P CYCLE COMPLETED CORRECTLY");
        } else {
            console.error("❌ BALANCE MISMATCH");
        }

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
