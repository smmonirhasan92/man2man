const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../modules/user/UserModel');

async function cleanupData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log("Connected to DB for Cleanup");

        const result = await User.updateMany(
            {},
            { $unset: { phoneHash: "", synthetic_phone: "" } }
        );

        console.log(`✅ Cleanup Complete.`);
        console.log(`   Docs Matched: ${result.matchedCount}`);
        console.log(`   Docs Modified: ${result.modifiedCount}`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
cleanupData();
