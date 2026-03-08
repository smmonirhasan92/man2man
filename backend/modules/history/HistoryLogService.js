
const Transaction = require('../wallet/TransactionModel');
const User = require('../user/UserModel');

class HistoryLogService {

    // Fetch Unified History (Ledger)
    async getLedger(userId, filters = {}) {
        const { startDate, endDate, type, limit = 50 } = filters;

        const queries = [];

        // [SECURITY] Enforce 24-hour history limit for untraceability
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Transactions (Wallet)
        const txnFilter = {
            userId,
            createdAt: { $gte: twentyFourHoursAgo }
        };
        if (type && type !== 'all' && type !== 'game') txnFilter.type = type;

        queries.push(Transaction.find(txnFilter).lean().then(docs => docs.map(d => ({
            ...d,
            id: d._id.toString(), // Fix: Ensure ID exists for frontend
            category: 'WALLET',
            source: d.type === 'referral_bonus' ? 'referral' : 'transaction',
            displayType: d.type ? d.type.replace('_', ' ').toUpperCase() : 'TRANSACTION',
            amount: d.amount,
            status: d.status,
            date: d.createdAt,
            title: d.description || (d.type === 'add_money' || d.type === 'recharge' ? 'Deposit' : d.type === 'plan_purchase' ? 'Package Purchase' : d.type ? d.type.replace('_', ' ').toUpperCase() : 'TRANSACTION'),
            details: d.description || d.recipientDetails
        }))));

        const results = await Promise.all(queries);
        const unified = results.flat();

        // Sort DESC
        unified.sort((a, b) => new Date(b.date) - new Date(a.date));

        return unified.slice(0, limit);
    }
}

module.exports = new HistoryLogService();
