const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function audit() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- Connected to DB ---');

        const superAdmins = await mongoose.connection.db.collection('users').find({ role: 'super_admin' }).toArray();
        console.log('Super Admins Found:', superAdmins.map(u => ({ id: u._id, name: u.fullName, email: u.email, phone: u.primary_phone })));

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

audit();
