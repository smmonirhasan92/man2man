const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: false // Fail fast if Redis is down
    }
});

client.on('error', (err) => {
    // Only log distinct errors or silence completely if expected
    if (err.code === 'ECONNREFUSED') {
        // Silent fail for development without Redis
    } else {
        console.warn('Redis Client Warning:', err.message);
    }
});
client.on('error', (err) => {
    // Only log distinct errors or silence completely if expected
    if (err.code === 'ECONNREFUSED') {
        // Silent fail for development without Redis
    } else {
        console.warn('Redis Client Warning:', err.message);
    }
});

client.on('connect', () => console.log('Redis Client Connected'));

const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
    }
};

module.exports = { client, connectRedis };
