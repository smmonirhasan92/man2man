const mongoose = require('mongoose');

const BotIdentitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String, enum: ['BD', 'USA', 'UAE', 'UK', 'IN'], default: 'BD' },
    avatar: { type: String, required: true }, // URL or local path
    isHighRoller: { type: Boolean, default: false }
});

module.exports = mongoose.model('BotIdentity', BotIdentitySchema);
