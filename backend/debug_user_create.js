const mongoose = require('mongoose');
const User = require('./modules/user/UserModel');
// const MONGO_URI = "mongodb://127.0.0.1:27017/universal_game_core_v1";
// Use the one from env or safe default
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/universal_game_core_v1";

async function debugCreate() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected");

        const RND = Math.floor(Math.random() * 100000);
        const TEST_USERNAME = `DebugUser_${RND}`;

        console.log(`Trying to create: ${TEST_USERNAME}`);

        const newUser = await User.create({
            username: TEST_USERNAME,
            fullName: 'Debug User',
            email: `debug_${RND}@example.com`,
            primary_phone: `017${RND}99999`,
            country: 'Bangladesh',
            password: 'password123',
            role: 'user',
            wallet: { main: 100 }
        });

        console.log("✅ Success:", newUser._id);

    } catch (err) {
        console.error("❌ Failed:");
        if (err.errors) {
            Object.keys(err.errors).forEach(k => {
                console.error(`Field: ${k}, Message: ${err.errors[k].message}`);
            });
        }
        console.error("Full Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected");
    }
}

debugCreate();
