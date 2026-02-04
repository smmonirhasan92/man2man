const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Use kernel database connection
const connectDB = require('../kernel/database');

const cleanup = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        try {
            await collection.dropIndex('username_1');
            console.log('Dropped username_1');
        } catch (e) { console.log('username_1 not found or err:', e.message); }

        try {
            await collection.dropIndex('referralCode_1');
            console.log('Dropped referralCode_1');
        } catch (e) { console.log('referralCode_1 not found or err:', e.message); }

        // Also clean up any other non-id indexes that look like duplicates or simple username/referralCode
        for (const idx of indexes) {
            if (idx.name === '_id_') continue;
            // logic: if index key has username or referralCode and is NOT the one we just dropped (which might still be in the list if we fetched list before drop)
            // actually we fetched list before drop.
            if (idx.key.username || idx.key.referralCode) {
                try {
                    await collection.dropIndex(idx.name);
                    console.log(`Dropped index by name: ${idx.name}`);
                } catch (e) {
                    // ignore if already dropped
                }
            }
        }

        console.log('Index cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('DB Cleanup Error:', err);
        process.exit(1);
    }
};

cleanup();
