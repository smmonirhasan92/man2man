const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
// const Ticket = require('../modules/lottery/TicketModel');
const Lottery = require('../modules/lottery/LotteryModel');
const BonusVault = require('../modules/bonus/BonusVaultModel');
const bcrypt = require('bcryptjs');

async function resetDB() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true');
        console.log('✅ Connected to MongoDB');

        // 1. Drop/Clean Collections
        // Drop users to be safe
        try {
            await mongoose.connection.db.collection('users').drop();
            console.log('🗑️ Users Collection Dropped');
        } catch (e) {
            console.log('⚠️ Users Collection Not Found (Skipping Drop)');
        }

        await Lottery.deleteMany({});
        await BonusVault.deleteMany({});
        // await Ticket.deleteMany({}); // Optional if model exists
        console.log('🗑️ Other Collections Purged');

        // 2. Create Users - ONLY 2 ACCOUNTS
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        const users = [
            {
                fullName: 'Super Admin',
                username: 'admin', // Generated usually, but hardcoding for clarity
                phone: '01700000000',
                password: passwordHash,
                role: 'super_admin',
                wallet: { main: 1000000, income: 0, purchase: 0, game: 0 },
                country: 'Bangladesh',
                status: 'active',
                deviceId: 'admin_device_001',
                referralCode: 'ADMIN01',
                isDeviceWhitelisted: true
            },
            {
                fullName: 'Demo User',
                username: 'demo_user',
                phone: '01701010101',
                password: passwordHash,
                role: 'user',
                wallet: { main: 5000, income: 0, purchase: 0, game: 0 },
                country: 'Bangladesh',
                status: 'active',
                deviceId: 'demo_device_001',
                referralCode: 'DEMO001'
            }
        ];

        await User.create(users);
        console.log('✅ Created 2 Users (Super Admin & Demo)');

        // 3. Create Test Lottery
        await Lottery.create({
            name: 'Grand Opening Jackpot',
            price: 50,
            prizePool: 5000,
            drawDate: new Date(Date.now() + 86400000), // Tomorrow
            status: 'active',
            participants: []
        });
        console.log('✅ Test Lottery Created');

        // 4. Init Vault
        await BonusVault.create({ totalBalance: 0, lastUpdated: new Date() });
        console.log('✅ Bonus Vault Initialized');

        await mongoose.disconnect();
        console.log('🏁 DB Reset Complete');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

resetDB();
