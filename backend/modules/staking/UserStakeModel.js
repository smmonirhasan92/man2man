const mongoose = require('mongoose');

const userStakeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StakingPool',
        required: true
    },
    stakedAmount: {
        type: Number,
        required: true,
        min: 1
    },
    expectedReward: {
        type: Number,
        required: true,
        min: 0
    },
    lockedAt: {
        type: Date,
        default: Date.now
    },
    unlocksAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    claimedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('UserStake', userStakeSchema);
