const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../modules/user/UserModel');

async function fix() {
    try {
        if (!process.env.MONGODB_URI) {
            if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
            await mongoose.connect(process.env.MONGO_URI);
        } else {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        console.log('DB Connected.');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        // Drop specific problematic indexes if they exist
        try { await collection.dropIndex('username_1'); console.log('Dropped username_1'); } catch (e) { console.log('username_1 not found or error'); }
        try { await collection.dropIndex('referralCode_1'); console.log('Dropped referralCode_1'); } catch (e) { console.log('referralCode_1 not found or error'); }

        console.log('Index Fix Complete.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fix();
