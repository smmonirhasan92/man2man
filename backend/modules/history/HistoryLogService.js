
const Transaction = require('../wallet/TransactionModel');
const GameLog = require('../game/GameLogModel');
const User = require('../user/UserModel');

class HistoryLogService {

    // Fetch Unified History (Ledger)
    async getLedger(userId, filters = {}) {
        const { startDate, endDate, type, limit = 50 } = filters;

        const queries = [];

        // 1. Transactions (Wallet)
        const txnFilter = { userId };
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

        // 2. Game Logs
        if (!type || type === 'all' || type === 'game') {
            queries.push(GameLog.find({ userId }).limit(100).sort({ createdAt: -1 }).lean().then(docs => docs.map(d => ({
                ...d,
                id: d._id.toString(), // Fix: Ensure ID exists
                category: 'GAME',
                source: 'game',
                displayType: d.gameType ? d.gameType.toUpperCase() : 'GAME', // Fix: Use gameType
                amount: d.result === 'win' ? d.winAmount : -d.betAmount, // Fix: Use winAmount/betAmount keys from Model
                status: d.status ? d.status.toUpperCase() : 'COMPLETED',
                date: d.createdAt,
                title: d.gameType ? d.gameType.toUpperCase() : 'GAME', // Fix: Use gameType
                details: `${d.gameType || 'Game'} ${d.status || ''}`
            }))));
        }

        const results = await Promise.all(queries);
        const unified = results.flat();

        // Sort DESC
        unified.sort((a, b) => new Date(b.date) - new Date(a.date));

        return unified.slice(0, limit);
    }
}

module.exports = new HistoryLogService();
