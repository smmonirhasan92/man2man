const mongoose = require('mongoose');

const userPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true
    },
    planName: { type: String, required: true }, // Snapshotted name
    dailyLimit: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'provisioning'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: true
    },
    provisioningUntil: {
        type: Date
    },
    serverIp: {
        type: String
    },
    serverLocation: { type: String, default: 'Virginia, USA' },
    syntheticPhone: { type: String },
    tasksCompletedToday: { type: Number, default: 0 },
    earnings_today: { type: Number, default: 0 }, // [NEW] Track daily earnings for weighted logic
    last_earning_date: { type: Date }, // [NEW] Reset tracker
    // OR we track global tasks? Master Prompt says "cumulative daily task limit"
    // So we just sum dailyLimit of all active plans.
    // tasksCompletedToday should be on User or global tracker.
}, { timestamps: true });

// Index for getting active plans
userPlanSchema.index({ userId: 1, status: 1, expiryDate: 1 });

module.exports = mongoose.model('UserPlan', userPlanSchema);
