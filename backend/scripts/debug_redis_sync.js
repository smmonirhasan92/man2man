const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const redisConfig = require('../config/redis');

async function checkSync() {
    // 1. Connect Mongo
    const mongoUri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?directConnection=true';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // 2. Connect Redis
    try {
        await redisConfig.connectRedis();
        console.log("Connected to Redis.");
    } catch (e) {
        console.log("Redis Connection Failed (Expected if service off):", e.message);
    }

    // 3. Find User
    const user = await User.findOne({ username: 'test55' }); // Assuming username or try to find by recent check
    // If test55 not found, try to find the one with ~$48 income
    const richUser = await User.findOne({ 'wallet.income': { $gt: 40 } });

    const targetUser = user || richUser;

    if (!targetUser) {
        console.log("No matching user found (test55 or income > 40).");
        process.exit(0);
    }

    console.log(`\n[MONGODB] User: ${targetUser.username} (${targetUser._id})`);
    console.log(` - Income Balance: ${targetUser.wallet.income}`);
    console.log(` - Main Balance:   ${targetUser.wallet.main}`);

    // 4. Check Redis
    if (redisConfig.client.isOpen) {
        const key = `user_profile:${targetUser._id}`;
        const cached = await redisConfig.client.get(key);
        if (cached) {
            const data = JSON.parse(cached);
            console.log(`\n[REDIS CACHE] Key: ${key}`);
            console.log(` - Income Balance: ${data.wallet?.income} (or ${data.income_balance})`);
            console.log(` - Main Balance:   ${data.wallet?.main} (or ${data.wallet_balance})`);

            if (data.wallet?.income !== targetUser.wallet.income) {
                console.log("\n❌ MISMATCH DETECTED: Cache is Stale!");
                // Force Clear
                await redisConfig.client.del(key);
                console.log("✅ Force Cleared Cache Key.");
            } else {
                console.log("\n✅ SYNCED: Cache matches DB.");
            }
        } else {
            console.log(`\n[REDIS] Key ${key} not found (Cache Miss).`);
        }
    } else {
        console.log("\n[REDIS] Client not open. Cannot check cache.");
    }

    process.exit(0);
}

checkSync();
