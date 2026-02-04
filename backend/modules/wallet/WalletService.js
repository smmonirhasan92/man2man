const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const SystemSetting = require('../settings/SystemSettingModel');

const { runTransaction } = require('../common/TransactionHelper');

class WalletService {

    // Helper to map Friendly Names -> Obfuscated DB Keys
    // Helper to map Friendly Names -> DB Keys (De-obfuscated)
    static getDBKey(walletType) {
        const map = {
            'main': 'wallet.main',
            'game': 'wallet.game',
            'income': 'wallet.income',
            'purchase': 'wallet.purchase',
            'agent': 'wallet.agent'
        };
        return map[walletType] || `wallet.${walletType}`; // Fallback
    }

    static async getBalance(userId) {
        const user = await User.findById(userId).select('wallet income_balance purchase_balance');
        if (!user) throw new Error('User not found');
        return {
            income_balance: user.wallet.income || 0,
            purchase_balance: user.wallet.purchase || 0,
            wallet_balance: user.wallet.main || 0, // Ensure consistency
            game_balance: user.wallet.game || 0,
            game_locked: user.wallet.game_locked || 0, // [TURNOVER TRAP]
            // [SYNC] Frontend Obfuscated Access
            w_dat: {
                m_v: user.wallet.main || 0,
                g_v: user.wallet.game || 0,
                i_v: user.wallet.income || 0,
                p_v: user.wallet.purchase || 0
            }
        };
    }

    // Helper to get system setting
    static async getSetting(key, defaultValue) {
        const setting = await SystemSetting.findOne({ key });
        return setting ? setting.value : defaultValue;
    }

    // Generic Transfer Method (Internal Use or specific flows)
    static async transferFunds(userId, amount, fromWallet, toWallet, description) {
        // STRICT POLICY: Game Wallet can ONLY receive funds from Main Wallet (BDT)
        // Block Income, Purchase, Agent, or any other source.
        if ((toWallet === 'game' || toWallet === 'wallet.game') && (fromWallet !== 'main' && fromWallet !== 'wallet.main')) {
            throw new Error('Game Wallet can only receive funds from Main Wallet (BDT). Direct transfers from other wallets are restricted.');
        }

        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const amt = parseFloat(amount);
            if (isNaN(amt) || amt <= 0) throw new Error('Invalid Amount');

            // [TURNOVER TRAP CHECK]
            if (fromWallet === 'game' || fromWallet === 'wallet.game') {
                const userCheck = await User.findById(userId).select('wallet.game wallet.game_locked').session(session);
                const locked = userCheck.wallet.game_locked || 0;
                const available = (userCheck.wallet.game || 0) - locked;

                if (amt > available) {
                    throw new Error(`Funds Locked! Unlocked: ${available.toFixed(2)}. Locked: ${locked.toFixed(2)}. Spin more to unlock.`);
                }
            }

            // Fee Logic: Apply 3% Fee ONLY for Income -> Main
            let fee = 0;
            let creditAmount = amt;
            let feeDescription = '';

            if (fromWallet === 'income' && (toWallet === 'main' || toWallet === 'wallet.main')) {
                fee = amt * 0.03; // 3%
                creditAmount = amt - fee;
                feeDescription = ` (Fee: ${fee})`;
            }

            // USE MASKED KEYS
            const sourceKey = WalletService.getDBKey(fromWallet);
            const targetKey = WalletService.getDBKey(toWallet);

            // [FIX] Atomic Deduct & Add with Pre-Check
            // 1. Check Balance first to provide clear error
            const checkUser = await User.findById(userId).select(sourceKey).session(session);
            if (!checkUser) throw new Error("User not found");

            // Extract nested value dynamically safely
            const keyParts = sourceKey.split('.');
            let currentBalance = checkUser;
            for (const k of keyParts) currentBalance = currentBalance ? currentBalance[k] : 0;

            if (currentBalance < amt) {
                throw new Error(`Insufficient funds in ${fromWallet} wallet (Balance: ${currentBalance})`);
            }

            // 2. Perform Atomic Swap
            // Deduct Full Amount (amt) from Source
            // Add Credit Amount (amt - fee) to Target
            const user = await User.findOneAndUpdate(
                { _id: userId, [sourceKey]: { $gte: amt } }, // Double-check race condition
                {
                    $inc: {
                        [sourceKey]: -amt,
                        [targetKey]: creditAmount
                    }
                },
                { new: true, session }
            );

            if (!user) throw new Error(`Transfer Failed: Balance changed or insufficient.`);

            // 3. Log Main Transfer
            await Transaction.create([{
                userId,
                type: 'wallet_transfer',
                amount: amt,
                status: 'completed',
                description: (description || `${fromWallet} to ${toWallet}`) + feeDescription,
                recipientDetails: 'Self Transfer',
                balanceAfter: user.wallet.main, // Snapshot main balance
                fee: fee // Store fee if any
            }], { session });

            // 3b. Log Fee Transaction if applicable
            if (fee > 0) {
                await Transaction.create([{
                    userId,
                    type: 'fee',
                    amount: -fee,
                    status: 'completed',
                    description: `Exchange Fee (3%) - ${fromWallet} to ${toWallet}`,
                    recipientDetails: 'System'
                }], { session });
            }

            // [REDIS] Invalidate Cache
            try {
                const redisInv = require('../../config/redis');
                await redisInv.client.del(`user_profile:${userId}`);
            } catch (e) { }

            return { success: true, newBalances: user.wallet, fee, creditAmount };
        });
    }

    // Atomic Deduction Helper
    static async deductBalance(userId, amount, walletType = 'main', reason = 'Operation') {
        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const amt = parseFloat(amount);
            const dbKey = WalletService.getDBKey(walletType);

            const user = await User.findOneAndUpdate(
                { _id: userId, [dbKey]: { $gte: amt } },
                { $inc: { [dbKey]: -amt } },
                { new: true, session }
            );
            if (!user) throw new Error('Insufficient Balance');
            return user;
        });
    }

    // Atomic Add Helper
    static async addBalance(userId, amount, walletType = 'main', reason = 'Operation') {
        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const amt = parseFloat(amount);
            const dbKey = WalletService.getDBKey(walletType);

            const user = await User.findByIdAndUpdate(
                userId,
                { $inc: { [dbKey]: amt } },
                { new: true, session }
            );
            return user;
        });
    }

    // Send Money (P2P)
    static async sendMoney(senderId, amount, recipientPhone) {
        return await runTransaction(async (session) => {
            const parsedAmount = parseFloat(amount);

            // Logic: Deduct from Income (w_dat.i) first, then Main (w_dat.m)
            // We need to fetch current balances to calculate split
            // Since we are inside a txn, we can read then write.

            const sender = await User.findById(senderId).session(session);
            const recipient = await User.findOne({ primary_phone: recipientPhone }).session(session);

            if (!sender) throw new Error('Sender not found');
            if (!recipient) throw new Error('Recipient not found');
            if (sender.id === recipient.id) throw new Error('Cannot send to self');

            // Access via Schema Virtuals for Reading (easier)
            const income = sender.wallet.income;
            const main = sender.wallet.main;
            const totalBal = income + main;

            if (totalBal < parsedAmount) throw new Error('Insufficient Balance');

            // Calculate Deductions
            let deductIncome = 0;
            let deductMain = 0;
            let remaining = parsedAmount;

            if (income >= remaining) {
                deductIncome = remaining;
                remaining = 0;
            } else {
                deductIncome = income;
                remaining -= income;
            }
            if (remaining > 0) {
                deductMain = remaining;
            }

            // Perform Atomic Updates using Correct Keys
            const updateFields = {};
            if (deductIncome > 0) updateFields['wallet.income'] = -deductIncome;
            if (deductMain > 0) updateFields['wallet.main'] = -deductMain;

            const updatedSender = await User.findOneAndUpdate(
                {
                    _id: senderId,
                    'wallet.income': { $gte: deductIncome },
                    'wallet.main': { $gte: deductMain }
                },
                { $inc: updateFields },
                { new: true, session }
            );

            if (!updatedSender) throw new Error('Balance mismatch during processing');

            // Create Transaction
            await Transaction.create([{
                userId: sender.id,
                type: 'send_money',
                amount: -parsedAmount,
                status: 'pending',
                recipientDetails: `Sent to: ${recipientPhone}`,
                relatedUserId: recipient.id,
                assignedAgentId: null
            }], { session });

            return { message: 'Send Money Request Pending Approval' };
        });
    }

    // Request Recharge (Add Money)
    static async requestRecharge(userId, amount, method, transactionId, recipientDetails, receivedByAgentId, proofImagePath) {
        try {
            const transaction = await Transaction.create({
                userId,
                type: 'add_money',
                amount: parseFloat(amount),
                status: 'pending',
                recipientDetails: recipientDetails || `Method: ${method}`,
                transactionId: transactionId, // [NEW] Dedicated field for uniqueness
                proofImage: proofImagePath,
                assignedAgentId: receivedByAgentId || null,
                receivedByAgentId: receivedByAgentId || null
            });

            return transaction;

        } catch (error) {
            console.error('WalletService Error:', error);
            throw error;
        }
    }
}

module.exports = WalletService;
