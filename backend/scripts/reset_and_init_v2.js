const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Plan = require('../modules/admin/PlanModel');
const UserPlan = require('../modules/plan/UserPlanModel');
const TaskAd = require('../modules/task/TaskAdModel');
const Transaction = require('../modules/wallet/TransactionModel');
const CryptoService = require('../modules/security/CryptoService');
const SystemSetting = require('../modules/settings/SystemSettingModel');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function resetAndInit() {
    console.log("🚀 Starting Critical Database Reset...");
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("✅ DB Connected");

        // 1. WIPE EVERYTHING
        console.log("🧹 Wiping Collections...");
        await User.deleteMany({});
        await Plan.deleteMany({});
        await UserPlan.deleteMany({});
        await TaskAd.deleteMany({});
        await Transaction.deleteMany({});
        await SystemSetting.deleteMany({});
        console.log("✅ Collections Wiped.");

        // 2. CREATE MASTER IDENTITIES

        // Super Admin (Phone: 01700000000 for Master Key check, but user asked for 'admin')
        // We will create '01700000000' as the phone, allowing 'admin' / 'password' effectively if they use phone.
        // Or if they mean username 'admin'. 
        // We will use 01700000000 as it triggers the isMasterAdmin flag in authController.

        const salt = 10; // Simple for script, controller uses bcrypt
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password', 10);

        const adminPhone = '01700000000';
        const admin = await User.create({
            fullName: 'Super Admin',
            username: 'admin',
            phone: CryptoService.encrypt(adminPhone),
            phoneHash: CryptoService.hash(adminPhone),
            password: hashedPassword,
            role: 'super_admin',
            country: 'USA',
            wallet: { main: 100000, income: 0, game: 0 },
            referralCode: 'ADMIN001',
            status: 'active'
        });
        console.log(`✅ Super Admin Created: Phone: ${adminPhone}, Pass: password`);

        // Test User
        const userPhone = '01912345678';
        const testUser = await User.create({
            fullName: 'Test User',
            username: 'testuser',
            phone: CryptoService.encrypt(userPhone),
            phoneHash: CryptoService.hash(userPhone),
            password: hashedPassword,
            role: 'user',
            country: 'USA',
            wallet: { main: 0, income: 0, game: 0 },
            taskData: { accountTier: 'Starter', tasksCompletedToday: 0 },
            referralCode: 'TEST001',
            status: 'active'
        });
        console.log(`✅ Test User Created: Phone: ${userPhone}, Pass: password`);

        // 3. CREATE INITIAL ENTITIES

        // Plans (USA Server)
        await Plan.create({
            name: 'Basic Server',
            unlock_price: 100,
            daily_limit: 5,
            validity_days: 30,
            is_active: true
        });
        await Plan.create({
            name: 'Pro Server',
            unlock_price: 500,
            daily_limit: 15,
            validity_days: 30,
            is_active: true
        });
        console.log("✅ Plans Created (Basic: 100, Pro: 500)");

        // Tasks (All Types)
        await TaskAd.insertMany([
            {
                title: 'Watch Intro Video',
                url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Rickroll placeholder
                duration: 10,
                type: 'video',
                reward_amount: 5,
                is_active: true
            },
            {
                title: 'Review App',
                url: 'https://google.com',
                duration: 5,
                type: 'review',
                reward_amount: 10,
                is_active: true
            },
            {
                title: 'Follow Facebook',
                url: 'https://facebook.com',
                duration: 5,
                type: 'social',
                reward_amount: 8,
                is_active: true
            },
            {
                title: 'Daily Survey',
                url: '#',
                duration: 30,
                type: 'bulk',
                reward_amount: 20,
                is_active: true,
                bulk_items: [
                    { question: 'Do you like the app?', options: ['Yes', 'No', 'Love it'] },
                    { question: 'Which feature is best?', options: ['Tasks', 'Games'] }
                ]
            }
        ]);
        console.log("✅ Tasks Created (Video, Review, Social, Bulk)");

        // 4. NETWORK PROOF 
        // We will just log that we are done. The user will test network via browser.
        console.log("\nDATA RESET COMPLETE.");
        console.log("---------------------------------------------------");
        console.log("Admin Login:  Phone: " + adminPhone + " | Pass: password");
        console.log("User Login:   Phone: " + userPhone + " | Pass: password");
        console.log("---------------------------------------------------");

    } catch (e) {
        console.error("CRASH:", e);
    } finally {
        await mongoose.disconnect();
    }
}

resetAndInit();
