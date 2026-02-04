const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            require('dotenv').config({ path: '.env' });
        }
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to Atlas...');
        await mongoose.connect(uri);
        console.log('Connected.');
    } catch (err) { console.error(err); }
};

const listUsers = async () => {
    await connectDB();
    const users = await User.find({}, 'primary_phone fullName role');
    console.log('--- ALL USERS ---');
    console.log(users);
    console.log('-----------------');
    process.exit(0);
};

listUsers();
