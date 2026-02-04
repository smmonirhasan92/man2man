const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['RECRUITER', 'EMPIRE_BUILDER', 'HIGH_ROLLER', 'SPEED_RACER'],
        required: true
    },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '🏆' }, // Emoji or URL
    awardedAt: { type: Date, default: Date.now },
    metadata: { type: Object }
}, { timestamps: true });

BadgeSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Badge', BadgeSchema);
