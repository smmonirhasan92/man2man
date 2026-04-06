const mongoose = require('mongoose');

const P2PAuditSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    gameType: {
        type: String, // 'spin', 'scratch', 'gift'
        required: true
    },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        betAmount: Number,
        winAmount: Number,
        netProfit: Number // winAmount - betAmount
    }],
    financials: {
        totalBetIn: Number,
        adminFeeDeducted: Number,
        interestFundDeducted: Number,
        redisPotContribution: Number,
        totalPayoutOut: Number,
        payoutSource: {
            type: String, // 'redis_pot', 'mongo_vault_fallback', 'mixed'
        }
    },
    redisPotState: {
        before: Number,
        after: Number
    }
}, { timestamps: true });

// Index for fast audit queries by date and game
P2PAuditSchema.index({ timestamp: -1, gameType: 1 });

module.exports = mongoose.model('P2PAudit', P2PAuditSchema);
