const redis = require('redis');
const logger = require('../utils/logger'); // Assuming logger exists, based on previous files

class RedisService {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        this.client.connect().then(() => {
            console.log('✅ Connected to Redis');
        }).catch(console.error);
    }

    async get(key) {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`Redis GET Error (${key}):`, error);
            return null;
        }
    }

    async set(key, value, ttlSeconds = 3600) {
        try {
            await this.client.set(key, value, {
                EX: ttlSeconds
            });
        } catch (error) {
            console.error(`Redis SET Error (${key}):`, error);
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Redis DEL Error (${key}):`, error);
        }
    }

    // --- Specific Caching Logic ---

    async cacheUserBalance(userId, balanceData) {
        await this.set(`balance:${userId}`, JSON.stringify(balanceData), 60); // Cache for 60s
    }

    async getUserBalance(userId) {
        const data = await this.get(`balance:${userId}`);
        return data ? JSON.parse(data) : null;
    }

    async invalidateUserBalance(userId) {
        await this.del(`balance:${userId}`);
    }

    async getGlobalSettings() {
        const data = await this.get('global_settings');
        return data ? JSON.parse(data) : null;
    }

    async cacheGlobalSettings(settings) {
        await this.set('global_settings', JSON.stringify(settings), 300); // 5 mins
    }
}

module.exports = new RedisService();
