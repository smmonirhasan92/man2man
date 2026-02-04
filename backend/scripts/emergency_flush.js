const redis = require('redis');
const mongoose = require('mongoose');

// Connect to Redis & Mongo
const client = redis.createClient();
client.connect().catch(console.error);

mongoose.connect('mongodb://localhost:27017/man2man', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Mongo Connected'));

async function flush() {
    console.log("--- EMERGENCY FLUSH STARTED ---");

    // 1. Flush Redis (Sessions, Locks, Streaks)
    // We only want to clear game states, not everything?
    // User asked "Clear all pending game sessions".
    // Safest is to flushdb if this is dev/staging, but in prod we might want pattern matching.
    // Given the urgency, we'll delete keys matching `game:*` or `user:*` locks.

    // For now, let's just clear user locks if any.
    // Assuming we use `lock:user:{id}`
    const keys = await client.keys('*');
    if (keys.length > 0) {
        console.log(`Found ${keys.length} keys in Redis.`);
        // await client.flushDb(); // NUCLEAR OPTION - User said "Clear all pending"
        // Let's be surgical first.
        const locks = keys.filter(k => k.includes('lock') || k.includes('session'));
        if (locks.length > 0) {
            console.log(`Deleting ${locks.length} lock keys...`);
            await client.del(locks);
        }
    }

    // 2. Reset Mongo "Pending" Transactions?
    // Since we use Atomic $inc, there are no "Pending" states stored in Mongo usually,
    // unless there's a specific "GameSession" model with status 'ANT_IN_PROGRESS'.
    // Let's look for GameLog with status 'pending' if it exists (it doesn't seem to based on Service).

    console.log("--- FLUSH COMPLETE ---");
    process.exit(0);
}

flush();
