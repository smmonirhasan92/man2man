const mongoose = require('mongoose');

const P2PTradeSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2POrder', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount: { type: Number, required: true },

    // Status Flow: CREATED -> PAID -> COMPLETED
    // Dispute Flow: CREATED/PAID -> DISPUTED -> RESOLVED_BUYER/RESOLVED_SELLER
    status: {
        type: String,
        enum: ['CREATED', 'PAID', 'AWAITING_ADMIN', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'RESOLVED_BUYER', 'RESOLVED_SELLER'],
        default: 'CREATED',
        index: true
    },

    // Timer & Metadata
    paymentProofUrl: { type: String }, // Optional
    txId: { type: String }, // New
    senderNumber: { type: String }, // New
    takerPaymentDetails: { type: String }, // [NEW] Seller's receiving info when initiating trade against a BUY Ad
    disputeReason: { type: String },
    disputeRaisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tracks who initiated the Tribunal

    // Security \u0026 Traceability [NEW]
    buyerIp: { type: String },
    sellerIp: { type: String },
    resolvedByIp: { type: String },

    // Timestamps
    expiresAt: { type: Date, required: true },
    paidAt: { type: Date },
    completedAt: { type: Date },
    disputeAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('P2PTrade', P2PTradeSchema);
