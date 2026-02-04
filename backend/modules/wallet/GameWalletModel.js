const mongoose = require('mongoose');

const GameWalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0.00,
        min: 0
    },
    totalDeposited: { type: Number, default: 0.00 },
    totalWagered: { type: Number, default: 0.00 },
    totalWon: { type: Number, default: 0.00 },
    lastUpdated: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('GameWallet', GameWalletSchema);
