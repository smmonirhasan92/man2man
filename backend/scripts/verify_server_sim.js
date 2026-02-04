const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const TaskAd = require('../modules/task/TaskAdModel');
const PlanService = require('../modules/plan/PlanService');
const TaskService = require('../modules/task/TaskService');
const WalletService = require('../modules/wallet/WalletService');
const LotteryService = require('../modules/lottery/LotteryService');
const Lottery = require('../modules/lottery/LotteryModel');
const LotteryManager = require('../modules/lottery/LotteryManager');
const Ticket = require('../modules/lottery/TicketModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const log = (msg) => console.log(msg);

async function runTest() {
    log("🚀 Starting FINAL Integration Test (V3)...");

    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        log("✅ DB Connected");

        // CLEANUP
        log("🧹 Clearing All Collections...");
        await User.deleteMany({});
        await Plan.deleteMany({});
        await UserPlan.deleteMany({});
        await Transaction.deleteMany({});
        await Lottery.deleteMany({});
        await Ticket.deleteMany({});
        log("✅ Collections Cleared.");

        const CryptoService = require('../modules/security/CryptoService');

        // 1. SETUP 3-LEVEL TREE
        // Root (Admin) -> User A -> User B

        const rootPhone = '01700000111';
        const userAPhone = '01700000222';
        const userBPhone = '01700000333';

        // Create Root
        let root = await User.create({
            fullName: 'Root Agent', username: 'root_agent',
            phone: CryptoService.encrypt(rootPhone), phoneHash: CryptoService.hash(rootPhone),
            password: 'hash', country: 'USA', referralCode: 'ROOT001',
            wallet: { main: 1000, income: 0, game: 1000 }
        });

        // Create User A (Under Root)
        let userA = await User.create({
            fullName: 'User A', username: 'user_a',
            phone: CryptoService.encrypt(userAPhone), phoneHash: CryptoService.hash(userAPhone),
            password: 'hash', country: 'USA', referralCode: 'USERA001',
            referredBy: 'ROOT001',
            wallet: { main: 1000, income: 0, game: 1000 }
        });

        // Create User B (Under User A)
        let userB = await User.create({
            fullName: 'User B', username: 'user_b',
            phone: CryptoService.encrypt(userBPhone), phoneHash: CryptoService.hash(userBPhone),
            password: 'hash', country: 'USA', referralCode: 'USERB001',
            referredBy: 'USERA001',
            wallet: { main: 1000, income: 0, game: 1000 }
        });

        log(`✅ Tree Created: Root -> A -> B`);

        // 2. USER B BUYS PLAN (Trigger 3-Level Commission)
        let plan = await Plan.create({
            name: 'Integration Test Plan', unlock_price: 500, daily_limit: 10, validity_days: 30, is_active: true
        });

        log("\n🛒 User B Purchasing Plan (Price: 500)...");
        await PlanService.purchasePlan(userB._id, plan._id);
        log("✅ Plan Purchased.");

        // 3. VERIFY COMMISSIONS
        // User A (Level 1) should get 10% = 50
        // Root (Level 2) should get 5% = 25

        const updatedA = await User.findById(userA._id);
        const updatedRoot = await User.findById(root._id);

        log(`\n💰 Commission Check:`);
        log(`   User A Income: ${updatedA.wallet.income} (Expected: 50)`);
        log(`   Root Income: ${updatedRoot.wallet.income} (Expected: 25)`);

        if (updatedA.wallet.income !== 50 || updatedRoot.wallet.income !== 25) {
            throw new Error(`Referral Commission Mismatch! A:${updatedA.wallet.income} Root:${updatedRoot.wallet.income}`);
        }
        log("✅ Referral Integration PASSED.");

        // 4. LOTTERY INTEGRATION
        log("\n🎰 Lottery Test: Game Wallet -> Income Wallet");

        // Create Lottery
        const lottery = await Lottery.create({
            title: 'Test Draw', price: 100, prizePool: 0,
            drawDate: new Date(Date.now() + 60000), status: 'active',
            totalTickets: 100, soldTickets: 0
        });

        // User B Buys Ticket (Cost 100, from Game Wallet)
        log("🎟️ User B Buying Ticket...");
        const ticketRes = await LotteryManager.purchaseTicket(userB._id, lottery._id, 1);
        if (!ticketRes.success) throw new Error("Ticket Buy Failed");
        log("✅ Ticket Bought.");

        // Verify Deduction
        const userB_AfterTicket = await User.findById(userB._id);
        if (userB_AfterTicket.wallet.game !== 900) throw new Error("Game Wallet Deduction Failed");

        // Force Draw Winner (User B)
        log("🏆 Forcing User B Win...");
        // Ensure prize logic in Service gives 80% (fixed in previous step).
        const winRes = await LotteryService.drawWinner(lottery._id, userB._id.toString());

        // Check Income Wallet Credit
        const userB_Final = await User.findById(userB._id);
        log(`   User B Income: ${userB_Final.wallet.income} (Expected: 80)`);

        if (userB_Final.wallet.income !== 80) { // 0 + 80 = 80
            throw new Error(`Lottery Payout Mismatch! Got ${userB_Final.wallet.income}`);
        }
        log("✅ Lottery Integration PASSED.");

        log("\n✅✅ START-TO-FINISH INTEGRATION COMPLETE ✅✅");

    } catch (e) {
        log("\n❌ TEST FAILED: " + e.message);
        log(e.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
