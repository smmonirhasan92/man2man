const mongoose = require('mongoose');

// Mongoose schema (simplified)
const planSchema = new mongoose.Schema({
    name: String,
    type: String,
    unlock_price: Number,
    validity_days: Number,
    is_active: { type: Boolean, default: true },
    server_id: { type: String, default: 'SERVER_01' }
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

async function createVipCards() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('Connected to DB');

        const cards = [
            { name: 'Silver Card', type: 'vip', unlock_price: 1500, validity_days: 30 },
            { name: 'Gold Card', type: 'vip', unlock_price: 3000, validity_days: 30 },
            { name: 'Platinum Card', type: 'vip', unlock_price: 6000, validity_days: 30 }
        ];

        for (const card of cards) {
            const existing = await Plan.findOne({ name: card.name });
            if (!existing) {
                await Plan.create(card);
                console.log(`Created ${card.name}`);
            } else {
                console.log(`${card.name} already exists`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        console.log('Done');
    }
}

createVipCards();
