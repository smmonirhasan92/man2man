const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            require('dotenv').config({ path: '.env' });
        }
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is missing");

        console.log('Connecting to Atlas...');
        await mongoose.connect(uri);
        console.log('Connected to Atlas');
    } catch (err) {
        console.error('DB Connection Failed:', err.message);
        process.exit(1);
    }
};

const seedAdmin = async () => {
    await connectDB();
    const phone = "01700000000";

    try {
        const existing = await User.findOne({ primary_phone: phone });
        if (existing) {
            console.log('User already exists. Attempting to promote instead...');
            existing.role = 'admin';
            existing.isVerified = true; // Assuming Verified status
            await existing.save();
            console.log(`✅ Admin User '${phone}' Updated/Promoted Successfully!`);
            process.exit(0);
        }

        console.log(`Creating new Admin User: ${phone}...`);

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        const newAdmin = new User({
            primary_phone: phone,
            username: 'admin01',
            fullName: 'Super Admin',
            role: 'admin',
            password: hashedPassword,
            country: 'BD',
            isVerified: true,
            kycStatus: 'approved',
            status: 'active'
        });

        await newAdmin.save();
        console.log(`✅ Admin User '${phone}' Created Successfully!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
