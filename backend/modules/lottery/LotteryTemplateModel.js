const mongoose = require('mongoose');

const lotteryTemplateSchema = new mongoose.Schema({
    tier: {
        type: String,
        required: true,
        unique: true
    },
    isActive: { type: Boolean, default: false }, // Automation on/off

    prizes: [{
        name: String,
        amount: Number,
        winnersCount: { type: Number, default: 1 }
    }],

    profitMultiplier: { type: Number, default: 5 },
    profitBuffer: { type: Number, default: 20 },
    lockDrawUntilTargetMet: { type: Boolean, default: false },
    durationMinutes: { type: Number, default: 0 }, // 0 for Instant/Target-based

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LotteryTemplate', lotteryTemplateSchema);
