const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://m2m-mongodb-test:27017/universal_game_core_docker?replicaSet=rs0');
        console.log('Connected to DB');
        await mongoose.connection.collection('users').dropIndex('primary_phone_1');
        console.log('Dropped primary_phone_1 index');
        await mongoose.connection.collection('users').dropIndex('email_1');
        console.log('Dropped email_1 index (if exists to fix sparse)');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
run();
