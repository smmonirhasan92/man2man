const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb+srv://smmonirhasan92_db_user:SUlXLLCe7gvtONDa@cluster0.ttzbkr2.mongodb.net/?appName=Cluster0";

async function checkLatestUser() {
    try {
        console.log('[DB] Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('[DB] Connected.');

        // Define minimal schema to avoid model compilation errors
        const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
        const User = mongoose.model('User', UserSchema, 'users');

        const latestUser = await User.findOne().sort({ createdAt: -1 });

        if (latestUser) {
            console.log('\n✅ [LATEST USER FOUND]');
            console.log(`ID: ${latestUser._id}`);
            console.log(`Name: ${latestUser.name || 'N/A'}`);
            console.log(`Phone: ${latestUser.phone || latestUser.mobileNumber || 'N/A'}`);
            console.log(`Created At: ${latestUser.createdAt}`);
        } else {
            console.log('\n⚠️ [NO USERS FOUND]');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ [DB ERROR]', err);
    }
}

checkLatestUser();
