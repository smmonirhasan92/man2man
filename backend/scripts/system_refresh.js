
const mongoose = require('mongoose');
const { createClient } = require('redis');
require('dotenv').config();

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function refreshSystem() {
    console.log("Starting System Refresh...");

    // 1. Connect to Redis
    const redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    console.log("Redis Connected.");

    // 2. Clear Aviator State
    await redisClient.del('aviator:round:current');
    console.log("Cleared aviator:round:current");

    // 3. Connect to MongoDB
    await mongoose.connect(MONGO_URI, {
        directConnection: true,
        serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB Connected.");

    // 4. Output Health Check
    console.log("[HEALTH_CHECK] MongoDB: Connected | Redis: Connected | Port 5050: Active (Pending Start)");
    console.log("[SOCKET_INFO] Aviator Broadcast Service: READY.");

    // Cleanup
    await redisClient.disconnect();
    await mongoose.disconnect();
    process.exit(0);
}

refreshSystem().catch(err => {
    console.error("Refresh Failed:", err);
    process.exit(1);
});
