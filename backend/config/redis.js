const redis = require('redis');

// [FIX] Robust Redis Connection with Graceful Fallback
// If REDIS_URL is invalid or missing, we simply DO NOT connect, allowing the app to run without cache.

let client = {
    isOpen: false,
    connect: async () => console.log('⚠️ Redis/Cache Disabled (No valid URL provided)'),
    get: async () => null,
    set: async () => null,
    del: async () => null,
    on: () => { }
};

// Only attempt real connection if a valid URL exists
const redisUrl = process.env.REDIS_URL || process.env.REDIS_EXTERNAL_URL || process.env.REDIS_TLS_URL;

if (redisUrl && redisUrl.startsWith('redis://')) {
    client = redis.createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 3) return new Error('Redis Retry Exhausted');
                return 1000;
            }
        }
    });

    client.on('error', (err) => console.warn('Redis Error (Non-Critical):', err.message));
    client.on('connect', () => console.log('✅ Redis Client Connected'));
} else {
    console.log('ℹ️ Redis URL missing or invalid (must start with redis://). Running in Cache-Free Mode.');
}

const connectRedis = async () => {
    if (redisUrl && !client.isOpen && client.connect) {
        try {
            await client.connect();
        } catch (e) {
            console.error("Redis Connection Failed:", e.message);
        }
    }
};

module.exports = { client, connectRedis };
