const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: '../.env' }); // Adjusted path for scripts folder

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            // Fallback for script execution context if .env not found relative to script
            require('dotenv').config({ path: '.env' });
        }

        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is missing in .env");

        console.log('Connecting to Atlas...');
        await mongoose.connect(uri);
        console.log('Connected to Atlas');
    } catch (err) {
        console.error('DB Connection Failed:', err.message);
        process.exit(1);
    }
};

const promoteUser = async () => {
    await connectDB();

    const targetPhone = "01700000000";

    try {
        const user = await User.findOne({ primary_phone: targetPhone });

        if (!user) {
            console.log(`❌ User with phone ${targetPhone} NOT FOUND.`);
            process.exit(0);
        }

        console.log(`Found User: ${user.fullName} (${user._id})`);
        console.log(`Current Role: ${user.role}`);

        user.role = 'admin';
        // user.isAdmin = true; // Not in schema, skipping to avoid strict mode errors if enabled
        // user.isVerified = true; // Not in schema shown, but might be dynamic or mixed. Skipping to be safe based on schema.

        // If kyStatus is relevant for "verified":
        user.kycStatus = 'approved';

        await user.save();

        console.log(`✅ SUCCESS: User ${targetPhone} promoted to ADMIN.`);
        console.log(`New Role: ${user.role}`);

        process.exit(0);

    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
};

promoteUser();
