const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function migrateLegacyUsers() {
    try {
        console.log('--- LEGACY USER MIGRATION SCRIPT ---');
        console.log(`Connecting to database at: ${process.env.MONGODB_URI}`);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        // Find users who have NO email or empty email or have emailVerified as null/false,
        // BUT specifically targeting phone-based registration (primary_phone exists but email is likely empty or unverified)
        const legacyUsers = await User.find({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: "" },
                { emailVerified: { $ne: true } }
            ],
            primary_phone: { $exists: true, $ne: null }
        });

        console.log(`🔍 Found ${legacyUsers.length} legacy users.`);

        if (legacyUsers.length === 0) {
            console.log('No legacy users found to migrate. Exiting.');
            process.exit(0);
        }

        const backupData = [];
        let updatedCount = 0;

        for (const user of legacyUsers) {
            // Backup user's wallet and critical info
            backupData.push({
                _id: user._id,
                username: user.username,
                primary_phone: user.primary_phone,
                wallet: user.wallet,
                createdAt: user.createdAt
            });

            // Update user to force email verification mode
            user.emailVerified = false;
            await user.save();
            updatedCount++;
        }

        // Write backup to a JSON file
        const backupPath = path.resolve(__dirname, 'legacy_users_backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        console.log(`✅ Successfully backed up data for ${backupData.length} users to ${backupPath}`);
        console.log(`✅ Successfully updated ${updatedCount} users to enforce Email Verification.`);
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

migrateLegacyUsers();
