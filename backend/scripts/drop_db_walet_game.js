const mongoose = require('mongoose');

async function dropDB() {
    const uri = 'mongodb://127.0.0.1:27017/walet-game';
    console.log(`Connecting to ${uri}...`);
    try {
        await mongoose.connect(uri);
        console.log("Connected. Dropping database 'walet-game'...");
        await mongoose.connection.dropDatabase();
        console.log("✅ Database 'walet-game' has been DROPPED successfully.");
    } catch (err) {
        console.error("❌ Error dropping database:", err.message);
    } finally {
        await mongoose.disconnect();
    }
}

dropDB();
