const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Define Schema for P2POrder (Minimal for migration)
const P2POrderSchema = new mongoose.Schema({
    amount: Number,
    status: String,
    type: String,
    rate: Number
});

const P2POrder = mongoose.models.P2POrder || mongoose.model('P2POrder', P2POrderSchema);

async function migrateP2POrders() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/universal_game_core_v1';
        console.log(`Connecting to: ${mongoUri}`);
        await mongoose.connect(mongoUri);

        console.log('--- P2P Order Normalization Migration ---');
        
        // Find all OPEN orders
        const orders = await P2POrder.find({ status: 'OPEN' });
        console.log(`Found ${orders.length} OPEN orders to migrate.`);

        let updatedCount = 0;
        for (let order of orders) {
            const oldAmount = order.amount;
            const newAmount = oldAmount * 2; // Doubling NXS to keep USD value same (since 1 NXS is now half value)

            order.amount = newAmount;
            await order.save();
            
            console.log(`[Order ${order._id}] Migrated: ${oldAmount} NXS -> ${newAmount} NXS`);
            updatedCount++;
        }

        console.log(`\n✅ Successfully migrated ${updatedCount} orders.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

migrateP2POrders();
