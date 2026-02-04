const mongoose = require('mongoose');
require('dotenv').config();

console.log("Checking DB Connection...");
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ Connection Successful");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Connection Failed:", err);
        process.exit(1);
    });
