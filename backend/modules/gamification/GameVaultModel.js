const mongoose = require('mongoose');

const GameVaultSchema = new mongoose.Schema({
    // Only one central vault will exist, identified by a static key
    vaultId: { type: String, required: true, unique: true, default: 'MASTER_VAULT' },
    
    // System Configurations
    config: {
        hardStopLimit: { type: Number, default: 1000 },  // Max single payout
        tightModeThreshold: { type: Number, default: 3000 }, // Pool drops below this = tight mode
        houseEdge: { type: Number, default: 10 }, // Probability constraint (in percent, e.g., 10%)
        isEnabled: { type: Boolean, default: true }
    },
    
    // Triple-Stream Balances
    balances: {
        adminIncome: { type: Number, default: 0 }, // 10% Risk-free
        userInterest: { type: Number, default: 0 }, // 15% Safety/Surprise Fund
        activePool: { type: Number, default: 0 }    // 75% Payout Pool
    },
    
    // Statistics for Dashboard
    stats: {
        totalBetsIn: { type: Number, default: 0 },
        totalPayoutsOut: { type: Number, default: 0 },
        totalGamesPlayed: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Helper to reliably get/initialize the master vault
GameVaultSchema.statics.getMasterVault = async function() {
    let vault = await this.findOne({ vaultId: 'MASTER_VAULT' });
    if (!vault) {
        vault = await this.create({
            vaultId: 'MASTER_VAULT',
            config: { hardStopLimit: 1000, tightModeThreshold: 3000, houseEdge: 10, isEnabled: true },
            balances: { adminIncome: 0, userInterest: 0, activePool: 0 }
        });
    }
    return vault;
};

module.exports = mongoose.model('GameVault', GameVaultSchema);
