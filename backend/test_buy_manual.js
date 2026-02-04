
const mongoose = require('mongoose');
const LotteryService = require('./modules/game/LotteryService');
const User = require('./modules/user/UserModel');
require('dotenv').config();

async function testBuy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");

        // 1. Get an active slot
        const active = await LotteryService.getActiveSlot('INSTANT');
        if (!active) {
            console.log("No Active INSTANT slot. Creating one...");
            await LotteryService.createSlot(1000, 5, 'INSTANT', 60);
        }
        const slot = await LotteryService.getActiveSlot('INSTANT');
        console.log("Target Slot:", slot.slotId);

        // 2. Get a user
        const user = await User.findOne({ 'wallet.main': { $gt: 20 } });
        if (!user) throw new Error("No wealthy user found");
        console.log("User:", user.username, "Balance:", user.wallet.main);

        // 3. Buy Ticket (Direct Service Call - verifying logic)
        // Note: The route fix was for valid HTTP requests. This verifies internal logic works.
        const result = await LotteryService.buyTicket(user._id, 1, slot.slotId);
        console.log("✅ Purchase Success:", result);

    } catch (e) {
        console.error("❌ Purchase Failed:", e.message);
    } finally {
        mongoose.disconnect();
    }
}

testBuy();
