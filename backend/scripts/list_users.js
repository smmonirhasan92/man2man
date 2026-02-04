require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/man2man');
        console.log("🔥 Connected to DB. Listing Users...");

        const users = await User.find({}).sort({ createdAt: -1 }).limit(10);
        users.forEach(u => {
            console.log(`User: ${u.username} | Email: ${u.email} | ID: ${u._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
