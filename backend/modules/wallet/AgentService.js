const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const Logger = require('../common/Logger');

class AgentService {

    /**
     * Agent Deposits Money to User (Agent Sells Coins)
     * Agent Stock (wallet.agent) Decreases. User Wallet (wallet.main) Increases.
     */
    async processDeposit(agentId, userId, amount) {
        if (amount <= 0) throw new Error("Invalid amount");

        return await TransactionHelper.runTransaction(async (session) => {
            const opts = { session };

            // 1. Deduct Agent Stock
            const agent = await User.findOneAndUpdate(
                { _id: agentId, 'wallet.agent': { $gte: amount } },
                { $inc: { 'wallet.agent': -amount } },
                { new: true, ...opts }
            );

            if (!agent) {
                // Determine error
                const exists = await User.exists({ _id: agentId });
                if (!exists) throw new Error("Agent not found");
                throw new Error("Insufficient Agent Balance");
            }

            // 2. Credit User
            const user = await User.findByIdAndUpdate(
                userId,
                { $inc: { 'wallet.main': amount } },
                { new: true, ...opts }
            );

            if (!user) throw new Error("User not found");

            // 3. Log Transactions
            // A. Agent Log
            await Transaction.create([{
                userId: agentId,
                type: 'agent_sell',
                amount: -amount,
                status: 'completed',
                description: `Deposit to User: ${user.username}`,
                recipientDetails: userId.toString()
            }], opts);

            // B. User Log
            const txn = await Transaction.create([{
                userId: userId,
                type: 'deposit',
                amount: amount,
                status: 'completed',
                description: `Deposit via Agent: ${agent.username}`,
                metadata: { agentId }
            }], opts);

            Logger.info(`[AGENT] Deposit: ${agent.username} -> ${user.username} (${amount})`);
            return txn[0];
        });
    }

    /**
     * Agent Accepts Withdrawal Request (Agent Buys Coins/Gives Cash)
     * User Wallet (wallet.main) Decreased Earlier. Agent Stock (wallet.agent) Increases.
     */
    async acceptWithdrawal(agentId, transactionId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const opts = { session };

            // 1. Atomic Verification & Update
            // Verify Agent ID match via metadata.agentId (need to cast if plain query, but finding first is safer for metadata check)

            // Fetch first to validate metadata complex object
            const txnCheck = await Transaction.findById(transactionId).session(session);
            if (!txnCheck) throw new Error("Transaction not found");
            if (txnCheck.status !== 'pending_agent_action') throw new Error("Transaction not pending agent action");
            // Strict ID Check
            if (txnCheck.metadata?.agentId?.toString() !== agentId.toString()) throw new Error("Unauthorized Agent");

            const amount = Math.abs(txnCheck.amount);

            // 2. Credit Agent Stock
            const agent = await User.findOneAndUpdate(
                { _id: agentId },
                { $inc: { 'wallet.agent': amount } },
                { new: true, ...opts }
            );
            if (!agent) throw new Error("Agent not found during credit");

            // 3. Update Transaction Status (Atomic Lock)
            const txn = await Transaction.findOneAndUpdate(
                { _id: transactionId, status: 'pending_agent_action' },
                {
                    status: 'completed',
                    completedAt: new Date()
                },
                { new: true, ...opts }
            );

            if (!txn) throw new Error("Transaction update failed (Concurrency Error)");

            Logger.info(`[AGENT] Withdrawal Accepted: ${agentId} for Txn ${transactionId}`);
            return txn;
        });
    }
}

module.exports = new AgentService();
