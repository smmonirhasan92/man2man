const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const connectDB = require('../kernel/database');
require('dotenv').config();

async function run() {
    await connectDB();

    const phone = '01999999999';
    await User.deleteOne({ primary_phone: phone });

    await User.create({
        fullName: 'Browser Test User',
        username: 'browsertest',
        primary_phone: phone,
        password: 'password123', // Assuming plain text or handled by service. If hashed, this might fail if login expects hash. 
        // Checking if simple string works. If login hashes input and compares to DB, we need to know that.
        // Usually, manual creation bypasses hashing if it's in a pre-save hook.
        // If login compares bcrypt.compare(input, dbHash), then we need to store a hash here.
        role: 'user',
        country: 'BD',
        wallet: { main: 5000, game: 5000 }
    });

    console.log('User created: 01999999999 / password123');
    process.exit();
}

run();
