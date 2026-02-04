
const { createClient } = require('redis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

async function seedPool() {
    const client = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.error('Redis Error:', err));
    await client.connect();

    const current = await client.get('wallet:global_prize_pool');
    console.log(`Current Pool: ${current}`);

    if (!current || parseFloat(current) < 1000) {
        console.log("Seeding Pool with 50,000 BDT...");
        await client.set('wallet:global_prize_pool', '50000');
        console.log("✅ Pool Seeded.");
    } else {
        console.log("✅ Pool has sufficient liquidity.");
    }

    await client.disconnect();
}

seedPool();
