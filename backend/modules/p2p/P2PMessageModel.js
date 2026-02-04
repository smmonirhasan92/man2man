const mongoose = require('mongoose');

const P2PMessageSchema = new mongoose.Schema({
    tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'P2PTrade', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    text: { type: String },
    imageUrl: { type: String },

    type: {
        type: String,
        enum: ['TEXT', 'IMAGE', 'SYSTEM'], // SYSTEM for "Buyer Marked Paid" messages
        default: 'TEXT'
    },

    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('P2PMessage', P2PMessageSchema);
