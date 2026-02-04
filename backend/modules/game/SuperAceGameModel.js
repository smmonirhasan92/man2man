const mongoose = require('mongoose');

const SuperAceGameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Game State
    grid: [[{ type: String }]], // 5x4 Grid of Symbols
    state: {
        type: String,
        enum: ['IDLE', 'SPINNING', 'CASCADING', 'FINISHED'],
        default: 'IDLE'
    },

    // Multiplier Engine
    comboMultiplier: { type: Number, default: 1 }, // 1, 2, 3, 5

    // Session Data
    totalBet: { type: Number, default: 0 },
    lastWin: { type: Number, default: 0 },

    // Recovery / Cascade Data
    queuedCascades: [{
        removedIndices: [[Number]], // [[row, col], [row, col]]
        addedSymbols: [[String]],   // Symbols falling in
        winAmount: Number
    }]

}, { timestamps: true });

module.exports = mongoose.model('SuperAceGame', SuperAceGameSchema);
