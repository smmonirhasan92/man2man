require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
const bcrypt = require('bcryptjs');

async function fixDuplicateSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const targetPhone = '01712345678';
        const users = await User.find({ phone: targetPhone }).sort({ createdAt: 1 });

        console.log(`Found ${users.length} users with phone ${targetPhone}`);

        if (users.length > 0) {
            // Keep the earliest created account, delete the rest
            const targetUser = users[0];

            if (users.length > 1) {
                const idsToDelete = users.slice(1).map(u => u._id);
                const delRes = await User.deleteMany({ _id: { $in: idsToDelete } });
                console.log(`Deleted ${delRes.deletedCount} duplicate accounts.`);
            }

            // Update the surviving account to be a super admin, bypassing strict validation
            const updateRes = await User.updateOne(
                { _id: targetUser._id },
                {
                    $set: {
                        role: 'super_admin',
                        password: hashedPassword,
                        status: 'active'
                    }
                }
            );

            console.log(`SUCCESS! User ${targetUser.name} (${targetUser.phone}) is now a SUPER ADMIN.`);
            console.log(`Modified Count: ${updateRes.modifiedCount}`);
        } else {
            console.log("No user found with that phone number.");
        }

        const allAdmins = await User.find({ role: 'super_admin' }, 'name phone role');
        console.log("Current Super Admins in DB:", JSON.stringify(allAdmins));

        process.exit(0);
    } catch (e) {
        console.error("ERROR", e);
        process.exit(1);
    }
}
fixDuplicateSuperAdmin();
