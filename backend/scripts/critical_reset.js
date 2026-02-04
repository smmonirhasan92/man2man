const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const Transaction = require('../modules/wallet/TransactionModel');
const Lottery = require('../modules/lottery/LotteryModel');
const Ticket = require('../modules/lottery/TicketModel');
const CryptoService = require('../modules/security/CryptoService');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const log = (msg) => console.log(msg);

async function criticalReset() {
    log("🚨 STARTING CRITICAL SYSTEM RESET 🚨");

    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        log("✅ DB Connected");

        // 1. WIPE DATA
        log("🧹 Wiping Database...");
        await User.deleteMany({});
        await Plan.deleteMany({});
        await UserPlan.deleteMany({});
        await Transaction.deleteMany({});
        await Lottery.deleteMany({});
        await Ticket.deleteMany({});
        log("✅ Data Wiped.");

        // 2. CREATE ADMIN
        const adminPhone = '01700000000';
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('password', salt);

        const admin = await User.create({
            fullName: 'Super Admin',
            username: 'admin',
            phone: CryptoService.encrypt(adminPhone),
            phoneHash: CryptoService.hash(adminPhone),
            password: adminHash,
            country: 'USA',
            role: 'super_admin',
            referralCode: 'ADMIN001',
            wallet: { main: 10000, income: 0, game: 10000 },
            isActive: true,
            status: 'active'
        });
        log(`✅ Admin Created: ${adminPhone} / password`);

        // 3. CREATE TEST USER
        const userPhone = '01912345678';
        const userHash = await bcrypt.hash('password', salt);

        const user = await User.create({
            fullName: 'Test User',
            username: 'test_user',
            phone: CryptoService.encrypt(userPhone),
            phoneHash: CryptoService.hash(userPhone),
            password: userHash,
            country: 'USA',
            role: 'user',
            referralCode: 'TEST001',
            referredBy: 'ADMIN001', // Link to Admin
            wallet: { main: 1000, income: 0, game: 1000 },
            isActive: true,
            status: 'active'
        });
        log(`✅ Test User Created: ${userPhone} / password`);

        log("\n✅✅ SYSTEM RESET COMPLETE ✅✅");
        process.exit(0);

    } catch (e) {
        log("❌ RESET FAILED: " + e.message);
        console.error(e);
        process.exit(1);
    }
}

criticalReset();
