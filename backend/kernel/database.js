const mongoose = require('mongoose');

// Default URI if not provided in env, using the replica set as requested
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/universal_game_core_v1';

const connectDB = async () => {
    try {
        const stateUri = process.env.MONGODB_URI || DEFAULT_URI;

        console.log(`[DEBUG] Connecting to DB...`);

        // Remove directConnection and family options for Atlas as they can cause issues
        // or let Mongoose handle defaults.
        const conn = await mongoose.connect(stateUri);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("MongoDB Atlas Connected Successfully"); // Verification Log
        console.log(`Database Name: ${conn.connection.name}`);

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
