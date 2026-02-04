const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
console.log('--- START DEBUG ---');
console.log('Testing connection to:', uri ? uri.split('@')[1] : 'UNDEFINED');

if (!uri) {
    console.error('MONGODB_URI is undefined!');
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB Atlas Connected Successfully');
        process.exit(0);
    })
    .catch(err => {
        console.log('--- CONNECTION ERROR ---');
        console.log(err.name);
        console.log(err.message);
        if (err.reason) console.log(err.reason);
        console.log('--- END ERROR ---');
        process.exit(1);
    });
