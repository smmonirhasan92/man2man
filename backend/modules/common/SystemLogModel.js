const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['info', 'warn', 'error', 'debug'],
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    context: {
        type: String, // e.g., 'AuthService', 'PaymentGateway'
        default: 'System'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed // Flexible for any object
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 60 * 60 * 24 * 7 // Auto-delete after 7 days
    }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
