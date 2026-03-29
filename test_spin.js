require('dotenv').config({ path: 'd:\\man2man\\backend\\.env' });
const mongoose = require('mongoose');
const User = require('./backend/modules/user/UserModel');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    const userId = "69b1257e37de0366f5e48916"; // from PM2 logs
    const cost = 1;
    
    // 1. Check user directly
    const directUser = await User.findById(userId);
    console.log("Direct User Wallet:", directUser?.wallet);
    
    // 2. Test findOneAndUpdate query
    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, 'wallet.main': { $gte: cost } },
        { $inc: { 'wallet.main': -1 } },
        { new: true }
    );
    console.log("Updated User Result:", updatedUser ? updatedUser.wallet : null);
    
    process.exit();
}
test();
