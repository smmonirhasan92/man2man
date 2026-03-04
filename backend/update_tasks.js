require('dotenv').config();
const mongoose = require('mongoose');
const TaskAd = require('./modules/task/TaskAdModel'); // Make sure path matches when run from backend folder

const HIGH_END_IMAGES = [
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800", // Tesla
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", // Nvidia GPU
    "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800", // VR Headset
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800", // Premium Apple Watch
    "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&q=80&w=800", // High End Desktop Setup
    "https://images.unsplash.com/photo-1507580461461-949e2954a6c4?auto=format&fit=crop&q=80&w=800", // Drone
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800", // Modern Smartphone
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800"  // Premium Headphones
];

async function updateDb() {
    console.log("Connecting to Database:", process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const ads = await TaskAd.find({});
        let updated = 0;

        for (let i = 0; i < ads.length; i++) {
            let ad = ads[i];
            // Assign sequentially to spread them out evenly
            ad.imageUrl = HIGH_END_IMAGES[i % HIGH_END_IMAGES.length];
            await ad.save();
            updated++;
        }

        console.log(`Successfully updated ${updated} tasks with High-End Product Images.`);
    } catch (e) {
        console.error("Error setting images:", e);
    } finally {
        process.exit(0);
    }
}

updateDb();
