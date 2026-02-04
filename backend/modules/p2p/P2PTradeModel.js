const mongoose = require('mongoose');

const P2PTradeSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2POrder', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount: { type: Number, required: true },

    // Status Flow: CREATED -> PAID -> COMPLETED
    // Dispute Flow: CREATED/PAID -> DISPUTE -> RESOLVED_BUYER/RESOLVED_SELLER
    status: {
        type: String,
        enum: ['CREATED', 'PAID', 'AWAITING_ADMIN', 'COMPLETED', 'CANCELLED', 'DISPUTE', 'RESOLVED_BUYER', 'RESOLVED_SELLER'],
        default: 'CREATED',
        index: true
    },

    // Timer & Metadata
    paymentProofUrl: { type: String }, // Optional
    txId: { type: String }, // New
    senderNumber: { type: String }, // New
    disputeReason: { type: String },

    // Timestamps
    paidAt: { type: Date },
    completedAt: { type: Date },
    disputeAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('P2PTrade', P2PTradeSchema);
