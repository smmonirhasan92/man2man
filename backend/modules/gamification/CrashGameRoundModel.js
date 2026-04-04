const mongoose = require('mongoose');

const CrashGameRoundSchema = new mongoose.Schema({
    roundIdentifier: { type: String, unique: true, required: true },
    
    // Core Game Data
    finalMultiplier: { type: Number, required: true, set: v => parseFloat(v.toFixed(2)) },
    
    // Financial Tracking
    totalBetsIn: { type: Number, default: 0.000000 },
    totalPayoutsOut: { type: Number, default: 0.000000 },
    adminCommissionCut: { type: Number, default: 0.000000 },
    
    // Participants
    playersActive: { type: Number, default: 0 },
    playersCashedOut: { type: Number, default: 0 },
    
    status: { type: String, enum: ['betting', 'flying', 'crashed'], default: 'betting' },
    
    startTime: { type: Date },
    crashTime: { type: Date }
}, {
    timestamps: true
});

// Index for fetching recent rounds history
CrashGameRoundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CrashGameRound', CrashGameRoundSchema);
