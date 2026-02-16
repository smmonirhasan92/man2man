const dotenv = require('dotenv');
const path = require('path');

// Try loading from ../.env
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error("Error loading .env:", result.error);
}

console.log("MONGODB_URI:", process.env.MONGODB_URI ? "LOADED" : "NOT LOADED");
console.log("CLIENT_URL:", process.env.CLIENT_URL);
