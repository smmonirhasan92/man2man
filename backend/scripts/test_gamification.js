const mongoose = require('mongoose');
const ReferralService = require('../modules/referral/ReferralService');
const User = require('../modules/user/UserModel');
const Badge = require('../modules/gamification/BadgeModel');
require('dotenv').config({ path: '../.env' });

async function testGamification() {
    try {
        console.log('CONNECTING...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('--- TESTING ACHIEVEMENT ---');
        // Find a user or create one
        let user = await User.findOne({ username: 'gamify_test' });
        if (!user) {
            user = await User.create({
                username: 'gamify_test', fullName: 'Gamer', phone: '01999999999',
                password: '123', country: 'BD', referralCount: 10
            });
        } else {
            user.referralCount = 10;
            await user.save();
        }

        // Run Check
        console.log(`Checking Achievements for ${user.username}...`);
        await ReferralService.checkAchievements(user._id);

        // Verify Badge
        const badges = await Badge.find({ userId: user._id });
        console.log('Badges Earned:', badges.length);
        if (badges.some(b => b.type === 'RECRUITER')) {
            console.log('✅ RECRUITER Badge Awarded!');
        } else {
            console.log('❌ Failed to award badge.');
        }

        // Clean up
        await Badge.deleteMany({ userId: user._id });
        await User.deleteOne({ _id: user._id });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testGamification();
