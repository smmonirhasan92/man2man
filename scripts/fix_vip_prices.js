const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: String,
    type: String,
    unlock_price: Number,
    validity_days: Number
}, { timestamps: true, strict: false });

const Plan = mongoose.model('Plan', planSchema);

async function updateCards() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('Connected to DB');

        await Plan.updateOne({ name: 'Silver Card' }, { $set: { unlock_price: 0 } });
        await Plan.updateOne({ name: 'Gold Card' }, { $set: { unlock_price: 15 } });
        await Plan.updateOne({ name: 'Platinum Card' }, { $set: { unlock_price: 30 } });
        
        console.log('Updated Card Prices: Silver=0, Gold=15, Platinum=30 NXS');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

updateCards();
