const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: String, required: true }, // [NEW] Explicit Unique ID
    quantity: { type: Number, default: 1 },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const lotterySlotSchema = new mongoose.Schema({
    prizeAmount: { type: Number, required: true },
    profitMultiplier: { type: Number, default: 5 },
    profitBuffer: { type: Number, default: 20 }, // Extra % profit margin to enforce
    lockDrawUntilTargetMet: { type: Boolean, default: false },
    targetSales: { type: Number, required: true }, // prize * multiplier
    currentSales: { type: Number, default: 0 },

    tier: {
        type: String,
        required: true,
        default: 'INSTANT'
    },

    ticketPrice: {
        type: Number,
        required: true,
        default: 20
    },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date }, // For time-based slots (Flash/Hourly/Mega)
    description: { type: String, default: '' }, // Prize Details / Promo Text

    status: {
        type: String,
        enum: ['ACTIVE', 'DRAWING', 'COMPLETED'],
        default: 'ACTIVE'
    },

    prizes: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        winnersCount: { type: Number, default: 1 }
    }],

    // Legacy support for single prize logic in older slots if needed, but V2 uses 'prizes' array

    tickets: [ticketSchema],

    winners: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tierName: { type: String },
        wonAmount: { type: Number },
        ticketId: { type: String }
    }],

    createdAt: { type: Date, default: Date.now },
    drawnAt: { type: Date }
});

// Middleware: Calculate targetSales from TOTAL prize pool
lotterySlotSchema.pre('save', async function () {
    if ((!this.targetSales || this.targetSales === 0) && this.prizes && this.prizes.length > 0 && this.profitMultiplier) {
        const totalPrizePool = this.prizes.reduce((sum, p) => sum + (p.amount * p.winnersCount), 0);
        this.prizeAmount = totalPrizePool; // Sync legacy field for display
        this.targetSales = totalPrizePool * this.profitMultiplier;
    }
});

module.exports = mongoose.model('LotterySlot', lotterySlotSchema);
