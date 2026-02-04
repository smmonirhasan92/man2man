const mongoose = require('mongoose');

const AccountTierSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    daily_limit: { type: Number, default: 5 },
    task_reward: { type: Number, default: 2.00 },
    reward_multiplier: { type: Number, default: 1.00 },
    unlock_price: { type: Number, default: 0.00 },
    validity_days: { type: Number, default: 365 },
    features: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AccountTier', AccountTierSchema);
