const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: {
        type: String,
        enum: [
            'withdraw', 'recharge', 'send_money', 'cash_out', 'add_money', 'deposit',
            'mobile_recharge', 'commission', 'admin_credit', 'admin_debit',
            'purchase', 'task_reward', 'referral_bonus', 'activation_fee',
            'wallet_transfer', 'game_win', 'game_loss', 'game_bet',
            'lottery_buy', 'lottery_win', 'fee', 'internal_transfer',
            'agent_recharge', 'agent_withdraw', 'agent_sell', 'admin_settlement', 'admin_adjustment',
            'referral_commission', 'plan_purchase',
            'p2p_sell', 'p2p_buy', 'admin_commission' // Added P2P
        ],
        required: true
    },

    amount: { type: Number, required: true }, // Positive or Negative based on flow
    bonusAmount: { type: Number, default: 0.00 },

    // [NEW] Unique Transaction ID for Deposit Verification
    transactionId: { type: String, unique: true, sparse: true },

    // [HISTORY FIX] Source of transaction for UI filtering (game, transaction, referral, p2p, income)
    source: { type: String, default: 'transaction', index: true },

    // [ARCHITECTURAL FIX] Strict Currency Flag
    currency: {
        type: String,
        enum: ['USD', 'NXS'],
        default: 'NXS' // Default to NXS for safety, logic should override
    },

    status: {
        type: String,
        enum: ['pending', 'completed', 'rejected', 'pending_admin_approval', 'pending_agent_action', 'pending_admin_review'],
        default: 'pending'
    },

    // Flexible Metadata Replacement for specific SQL columns
    description: { type: String },
    recipientDetails: { type: String }, // For send_money, mobile_recharge
    proofImage: { type: String },       // For recharge
    adminComment: { type: String },

    // Relationships
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For P2P transfers
    metadata: { type: mongoose.Schema.Types.Mixed } // Flexible storage for idempotency, agentIds, etc.

}, {
    timestamps: true
});

// [PHASE 4] Auto-generate unique Transaction ID
TransactionSchema.pre('save', async function () {
    if (!this.transactionId) {
        // Generate a 12-char alphanumeric uppercase ID
        const crypto = require('crypto');
        this.transactionId = 'TXN-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    }
});

// Index for getting user history quickly
TransactionSchema.index({ userId: 1, createdAt: -1 });
// [NEW] Performance Indexes
TransactionSchema.index({ type: 1, status: 1 }); // For filtering (e.g. pending withdrawals)
TransactionSchema.index({ createdAt: -1 }); // For Global History
TransactionSchema.index({ 'metadata.idempotencyKey': 1 }); // For Idempotency Check

module.exports = mongoose.model('Transaction', TransactionSchema);
