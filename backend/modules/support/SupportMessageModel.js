const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderRole: { type: String, enum: ['user', 'admin'], default: 'user' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportMessage', SupportMessageSchema);
