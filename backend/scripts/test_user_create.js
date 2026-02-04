const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const CryptoService = require('../modules/security/CryptoService');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';

async function test() {
    try {
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log('DB Connected');

        const phone = '01999999990';
        // Clean up old
        await User.deleteOne({ phoneHash: CryptoService.hash(phone) });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const user = await User.create({
            fullName: 'Test User',
            username: 'test_user_01',
            phone: CryptoService.encrypt(phone),
            phoneHash: CryptoService.hash(phone),
            password: hashedPassword,
            country: 'US',
            role: 'user',
            status: 'active',
            taskData: { accountTier: 'Starter', tasksCompletedToday: 0 },
            wallet: { main: 0, income: 0, game: 0, purchase: 0 }
        });

        console.log('User Created:', user._id);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

test();
