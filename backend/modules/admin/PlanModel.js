const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['vip', 'server', 'number'],
        default: 'server'
    },
    daily_limit: {
        type: Number,
        default: 5
    },
    task_reward: {
        type: Number,
        default: 2.0
    },
    unlock_price: {
        type: Number,
        default: 0
    },
    roi_percentage: {
        type: Number,
        default: 150 // [NEW] Target ROI % (e.g. 150% of unlock_price)
    },
    price_usd: {
        type: Number,
        default: 0
    },
    validity_days: {
        type: Number,
        default: 35 // [MODIFIED] 35-Day Cycle
    },
    reward_multiplier: {
        type: Number,
        default: 1.0
    },
    node_code: {
        type: String,
        default: 'STD_NODE',
        trim: true
    },
    // [NEW] Strict Server Separation
    server_id: {
        type: String,
        required: true,
        default: 'SERVER_01', // Default to first group
        index: true
    },
    features: [String], // Array of strings describing features
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Normalize ID for frontend
planSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Plan', planSchema);
