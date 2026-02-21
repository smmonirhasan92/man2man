const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.production' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.connection.collection('users');

        const phone = '01712345678';
        const password = '000000';

        // Custom Hash Logic for man2man
        const phoneHash = crypto.createHash('sha256').update('+8801712345678').digest('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.updateOne(
            { phone: phone },
            {
                $set: {
                    fullName: 'Super Admin',
                    username: 'admin1',
                    phone: phone,
                    primary_phone: '+8801712345678',
                    phoneHash: phoneHash,
                    password: hashedPassword,
                    role: 'super_admin',
                    country: 'Bangladesh',
                    wallet: { main: 10000, income: 0, game: 10000 },
                    status: 'active',
                    isDeviceWhitelisted: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log('\n======================================');
        console.log('✅ Success: Super Admin Account Created!');
        console.log('======================================');
        console.log('📱 Phone: ' + phone);
        console.log('🔑 Pass: ' + password);
        console.log('======================================\n');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
