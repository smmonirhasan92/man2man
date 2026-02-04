const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./modules/user/UserModel');

async function whitelistAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('✅ Connected to MongoDB');

        // Find the first admin user
        const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });

        if (!admin) {
            console.log('❌ No Admin User Found!');
        } else {
            console.log(`🔍 Found Admin: ${admin.username} (${admin.role})`);

            // Set whitelist flag
            admin.isDeviceWhitelisted = true;

            // Ensure they have a deviceId (if null, this won't help much until they login/update it, 
            // but usually registration sets it. If manual creation didn't set it, we need to be careful).
            if (!admin.deviceId) {
                // If admin has no deviceId, we can't whitelist the DEVICE yet.
                // But setting the flag is the first step.
                console.log('⚠️ Admin has no DeviceID yet. The flag is set, so once they login/register with a DeviceID, it should stick if logic updates it.');
            }

            await admin.save();
            console.log('✅ Admin Device Whitelisted Successfully!');
            console.log('Now this PC allows unlimited accounts.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

whitelistAdmin();
