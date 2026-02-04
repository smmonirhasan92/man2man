const mongoose = require('mongoose');

const TaskAdSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String, // Thumbnail for the Ad
        required: false
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    priority: {
        type: Number,
        default: 0 // Higher shows first
    },
    type: {
        type: String,
        enum: ['ad_view', 'video', 'review', 'social', 'bulk'],
        default: 'ad_view'
    },
    bulk_items: [{
        question: String,
        options: [String],
        correct_answer: String // Optional, if we want to grade it
    }],
    reward_amount: {
        type: Number,
        required: true
    },
    proof_requirements: {
        type: String, // Instructions for review/reply tasks
        trim: true
    },
    // [NEW] Strict Task Separation
    server_id: {
        type: String,
        required: true,
        default: 'SERVER_01',
        index: true
    },
    valid_plans: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('TaskAd', TaskAdSchema);
