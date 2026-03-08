const mongoose = require('mongoose');

const TransactionLedgerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // deposit, withdrawal, trade, commission, mint, burn
    amount: { type: Number, required: true }, // The transaction amount
    fee: { type: Number, default: 0 },

    // Strict Ledger Balances
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    description: { type: String },

    // Audit
    metadata: { type: mongoose.Schema.Types.Mixed },
    transactionId: { type: String, unique: true }
}, {
    timestamps: true
});

// CRITICAL: Integrity Check Pre-Save
TransactionLedgerSchema.pre('save', function () {
    // 1. Calculate Expected Result
    // balanceAfter = balanceBefore + amount (signed) - fee (always positive deduction if applicable)

    // Convert to strict floats
    const beforeBal = parseFloat(parseFloat(this.balanceBefore).toFixed(4));
    const amt = parseFloat(parseFloat(this.amount).toFixed(4));
    const txFee = parseFloat(parseFloat(this.fee).toFixed(4));

    const expectedAfter = parseFloat((beforeBal + amt - txFee).toFixed(4));
    const actualAfter = parseFloat(parseFloat(this.balanceAfter).toFixed(4));

    // Ensure tight mathematical balance (0.0005 epsilon to account for 4-decimal casting)
    if (Math.abs(expectedAfter - actualAfter) > 0.0005) {
        throw new Error(`LEDGER INTEGRITY FAILURE: ${this.userId}. Before: ${beforeBal}, Amount: ${amt}, Fee: ${txFee}, Expected: ${expectedAfter}, Actual: ${actualAfter}`);
    }
});

module.exports = mongoose.model('TransactionLedger', TransactionLedgerSchema);
