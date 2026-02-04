const mongoose = require('mongoose');

const GameLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameType: { type: String, required: true }, // 'mines', 'aviator', 'lottery'
    gameId: { type: String, required: true },

    // Financials
    betAmount: { type: Number, required: true },
    winAmount: { type: Number, default: 0 },
    multiplier: { type: Number, default: 0 },
    profit: { type: Number, default: 0 }, // win - bet (can be negative)

    // Status
    status: { type: String, enum: ['win', 'loss', 'refund'], required: true },

    // Metadata (Generic for any game)
    details: { type: mongoose.Schema.Types.Mixed }, // e.g. { minesCount: 3, crashPoint: 1.2 }

}, { timestamps: true });

// Indexes
GameLogSchema.index({ gameType: 1, createdAt: -1 });
GameLogSchema.index({ userId: 1, gameType: 1 });

module.exports = mongoose.model('GameLog', GameLogSchema);
