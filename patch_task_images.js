const mongoose = require('mongoose');

const HIGH_END_IMAGES = [
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800", // Tesla
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800", // Nvidia GPU
    "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800", // VR Headset
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800", // Premium Apple Watch
    "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&q=80&w=800", // High End Desktop Setup
];

require('./backend/kernel/database')().then(async () => {
    try {
        const TaskAd = require('./backend/modules/task/TaskAdModel');
        const ads = await TaskAd.find({});
        let updated = 0;

        for (let i = 0; i < ads.length; i++) {
            let ad = ads[i];

            // Overwrite existing or populate missing images
            ad.imageUrl = HIGH_END_IMAGES[i % HIGH_END_IMAGES.length];
            await ad.save();
            updated++;
        }

        console.log(`Successfully updated ${updated} tasks with High-End Product Images.`);
    } catch (e) {
        console.error("Diagnosis error:", e);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
});
