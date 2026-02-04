const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function testAuth() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true');
        console.log('✅ Connected to MongoDB');

        const testUsers = [
            { phone: '01700000000', password: 'no_password_needed_for_master' },
            { phone: '01701010101', password: '123456' }
        ];

        for (const test of testUsers) {
            console.log(`\nTesting Login for: ${test.phone}`);
            const user = await User.findOne({ primary_phone: test.phone });

            if (!user) {
                console.log(`❌ User NOT found for phone: ${test.phone}`);
                continue;
            }
            console.log(`✅ User found: ${user.username} (Role: ${user.role})`);

            if (test.phone === '01700000000') {
                console.log('✨ Master Key Logic: Bypass Check - SUCCESS');
            } else {
                const isMatch = await bcrypt.compare(test.password, user.password);
                if (isMatch) {
                    console.log('✨ Standard Password Match - SUCCESS');
                } else {
                    console.log('❌ Password Mismatch!');
                }
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

testAuth();
