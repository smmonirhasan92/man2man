const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // Can store String, Number, Boolean, or JSON Object
    category: {
        type: String,
        enum: ['game', 'global', 'payment', 'system'],
        default: 'system'
    },
    description: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
