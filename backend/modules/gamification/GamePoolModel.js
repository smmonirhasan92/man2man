const mongoose = require('mongoose');

const GamePoolSchema = new mongoose.Schema({
    // Singleton pattern
    poolId: { type: String, default: 'GLOBAL_CRASH_POOL', unique: true },
    
    // Core Balances
    currentLiquidity: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
    totalAdminCommissionGained: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
    
    // Limits & Margins
    adminProfitMarginPercent: { type: Number, default: 10.0 }, // 10%
    
    // Tracking All Time History
    totalBetsReceived: { type: Number, default: 0.000000 },
    totalPayoutsSent: { type: Number, default: 0.000000 }
}, {
    timestamps: true
});

module.exports = mongoose.model('GamePool', GamePoolSchema);
