const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String }, // Optional sub-message

    // Background Config
    bgType: { type: String, enum: ['image', 'color'], default: 'image' },
    bgValue: { type: String, required: true }, // Image URL or Hex Color code

    // Button Config
    btnText: { type: String },
    btnLink: { type: String },
    btnColor: { type: String, default: '#EF4444' }, // Default Red

    // Display Config
    order: { type: Number, default: 0 },
    textAnimation: { type: String, enum: ['fade-up', 'slide-left', 'zoom'], default: 'fade-up' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);
module.exports = Banner;
