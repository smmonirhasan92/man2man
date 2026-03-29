const mongoose = require('mongoose');

const stakingPoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        example: '7 Days Hold'
    },
    durationDays: {
        type: Number,
        required: true,
        min: 1
    },
    rewardPercentage: {
        type: Number,
        required: true,
        min: 0,
        example: 2 // 2% return
    },
    minAmount: {
        type: Number,
        required: true,
        min: 1,
        default: 50 // Minimum 50 NXS
    },
    isActive: {
        type: Boolean,
        default: true
    },
    badgeColor: {
        type: String,
        default: 'text-emerald-400 bg-emerald-500/10' // UI hinting
    }
}, { timestamps: true });

module.exports = mongoose.model('StakingPool', stakingPoolSchema);
