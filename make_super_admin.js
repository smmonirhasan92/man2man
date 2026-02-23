const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');
const bcrypt = require('bcryptjs');

// MongoDB URI - Assuming it uses the standard dev URL or loads from .env 
// We will just connect locally for this script assuming it runs on the server
const MONGO_URI = 'mongodb://127.0.0.1:27017/man2man';

async function makeSuperAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const phone = '01712345678';
        const passwordPlain = '000000';

        // Find the user
        let user = await User.findOne({ phone: phone });

        if (user) {
            console.log(`User found with phone ${phone}. Current role: ${user.role}`);

            // Assign super_admin role
            user.role = 'super_admin';

            // If they want the password to be exactly 000000, let's update it too just in case
            // Generate salt and hash it
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(passwordPlain, salt);

            await user.save();
            console.log(`Success! User ${phone} role updated to super_admin and password reset to ${passwordPlain}.`);
        } else {
            console.log(`User not found with phone ${phone}. Creating one...`);

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passwordPlain, salt);

            user = new User({
                fullName: "Super Admin",
                phone: phone,
                username: "SuperAdmin1",
                password: hashedPassword,
                role: 'super_admin',
                wallet: { main: 0, non_withdrawable: 0 },
                status: 'active'
            });
            await user.save();
            console.log(`Success! New Super Admin created with phone ${phone} and password ${passwordPlain}.`);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

makeSuperAdmin();
