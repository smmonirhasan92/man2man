const mongoose = require('mongoose');
const path = require('path');
const User = require('../modules/user/UserModel');
const LotteryService = require('../modules/lottery/LotteryService');
const Lottery = require('../modules/lottery/LotteryModel');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runLotteryCheck() {
    let connection = null;
    try {
        console.log('🎟️ Starting Lottery Logic Verification...');
        connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        // 1. Create a Test User
        const testUser = await User.create({
            username: `lottotester_${Date.now()}`,
            fullName: 'Lottery Tester',
            phone: `018${Math.floor(Math.random() * 100000000)}`,
            password: '123',
            country: 'BD',
            wallet: { main: 1000 }
        });
        console.log(`Test User Created: ${testUser.username}`);

        // 2. Create Active Lottery
        const lotteryData = {
            name: 'Test Jackpot',
            price: 50,
            drawDate: new Date(Date.now() + 86400000), // Tomorrow
            status: 'active'
        };
        const lot = await LotteryService.createLottery(lotteryData);
        console.log(`Lottery Created: ${lot.name}`);

        // 3. Book Ticket
        console.log('Booking Ticket...');
        const bookResult = await LotteryService.bookTicket(testUser._id, lot._id);
        console.log(`Ticket Booked: ${bookResult.ticketNumber}`);

        // Verify Ticket in DB
        const updatedLot = await Lottery.findById(lot._id);
        const hasTicket = updatedLot.tickets.some(t => t.ticketNumber === bookResult.ticketNumber);

        if (!hasTicket) throw new Error('Ticket not found in Lottery DB!');
        console.log('✅ Ticket verification pass.');

        // 4. Force Draw Winner (Targeted)
        console.log('Forcing Targeted Draw...');
        const drawResult = await LotteryService.drawWinner(lot._id, testUser._id.toString());

        if (drawResult.winner.userId.toString() === testUser._id.toString()) {
            console.log(`✅ Draw Success! Winner is ${drawResult.winner.userId}`);
            console.log(`Prize Amount: ${drawResult.winner.amount}`);
        } else {
            console.error('❌ Draw Failed or Wrong Winner.');
        }

        // Cleanup
        await User.findByIdAndDelete(testUser._id);
        await Lottery.findByIdAndDelete(lot._id);
        console.log('Cleanup Done.');

    } catch (e) {
        console.error('FATAL ERROR:', e);
    } finally {
        if (connection) await mongoose.disconnect();
        process.exit(0);
    }
}

runLotteryCheck();
