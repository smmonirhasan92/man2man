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
// TransactionLedgerSchema.pre('save', function (next) {
//     // 1. Calculate Expected Result
//     // If credit: before + amount - fee = after
//     // If debit: before - amount - fee = after
//     // However, amount can be signed or unsigned. Let's assume 'amount' is the signed change.
//     // If amount is +100, fee is 2. Net change +98.
//     // If amount is -100, fee is 2. Net change -102? Or is fee separate?

//     // Let's standardise: 
//     // balanceAfter = balanceBefore + amount (signed) - fee (always positive deduction if applicable)

//     // const expectedAfter = Number((this.balanceBefore + this.amount - this.fee).toFixed(4));
//     // const actualAfter = Number(this.balanceAfter.toFixed(4));

//     // if (Math.abs(expectedAfter - actualAfter) > 0.0001) {
//     //     const err = new Error(`LEDGER INTEGRITY FAILURE: ${this.userId}. Before: ${this.balanceBefore}, Amount: ${this.amount}, Fee: ${this.fee}, Expected: ${expectedAfter}, Actual: ${this.balanceAfter}`);
//     //     console.error(err.message);
//     //     return next(err);
//     // }

//     // next();
//     next();
// });

module.exports = mongoose.model('TransactionLedger', TransactionLedgerSchema);
