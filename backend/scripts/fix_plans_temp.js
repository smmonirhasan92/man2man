require('dotenv').config({ path: 'd:/man2man/backend/.env' });
const mongoose = require('mongoose');

async function fixPlans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const planCol = mongoose.connection.db.collection('plans');

        // Update Silver
        await planCol.updateOne(
            { name: 'USA SILVER SERVER' },
            { $set: { server_id: 'SERVER_01', price_usd: 10, unlock_price: 500 } }
        );

        // Update Gold
        await planCol.updateOne(
            { name: 'USA GOLD SERVER' },
            { $set: { server_id: 'SERVER_02', price_usd: 25, unlock_price: 1250 } }
        );

        console.log('Successfully updated Server IDs and Reduced Prices.');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
fixPlans();
