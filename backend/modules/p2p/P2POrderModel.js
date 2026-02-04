const mongoose = require('mongoose');

const P2POrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NXS' },

    paymentMethod: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'bank'],
        required: true
    },
    paymentDetails: { type: String, required: true }, // Encrypted or Hidden until match ideally, but simple string for now

    status: {
        type: String,
        enum: ['OPEN', 'LOCKED', 'AWAITING_ADMIN', 'DISPUTE', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
        index: true
    },

    activeTradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2PTrade' }, // Populated when matched

    // Limits
    minLimit: { type: Number, default: 0 },
    maxLimit: { type: Number, default: 0 }, // 0 = Full amount only

}, { timestamps: true });

module.exports = mongoose.model('P2POrder', P2POrderSchema);
