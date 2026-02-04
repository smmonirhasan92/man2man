const mongoose = require('mongoose');

const PublicWinSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true }, // Store snapshot
    game: { type: String, required: true },
    amount: { type: Number, required: true },
    multiplier: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h
});

module.exports = mongoose.model('PublicWin', PublicWinSchema);
