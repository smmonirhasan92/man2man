const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(() => {
        fs.writeFileSync('debug_error.txt', 'SUCCESS: MongoDB Atlas Connected Successfully');
        process.exit(0);
    })
    .catch(err => {
        const msg = `ERROR: ${err.name} - ${err.message}`;
        fs.writeFileSync('debug_error.txt', msg);
        process.exit(1);
    });
