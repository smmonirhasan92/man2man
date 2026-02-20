const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const TransactionLedger = require('./TransactionLedgerModel'); // [NEW] Unified Ledger
const SystemSetting = require('../settings/SystemSettingModel');
const NotificationService = require('../notification/NotificationService'); // [NEW] For Agent Alert

const { runTransaction } = require('../common/TransactionHelper');

class WalletService {

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
            throw new Error('Game Wallet can only receive funds from Main Wallet. Direct transfers from other wallets are restricted.');
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

            // [FIX] Atomic Balance Check (Read Before Write for Ledger)
            const checkUser = await User.findById(userId).select(`${sourceKey} ${targetKey}`).session(session);
            if (!checkUser) throw new Error("User not found");

            // Helper to get nested value
            const getVal = (obj, path) => path.split('.').reduce((o, i) => o ? o[i] : 0, obj);

            const balBeforeSource = getVal(checkUser, sourceKey) || 0;
            const balBeforeTarget = getVal(checkUser, targetKey) || 0;

            if (balBeforeSource < amt) {
                throw new Error(`Insufficient funds in ${fromWallet} wallet (Balance: ${balBeforeSource})`);
            }

            // 2. Perform Atomic Swap
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

            // Get New Balances
            const balAfterSource = getVal(user, sourceKey);
            const balAfterTarget = getVal(user, targetKey);

            const trxId = `TRX_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

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

            // [LEDGER] Log Source Debit
            await TransactionLedger.create([{
                userId,
                type: 'transfer_out',
                amount: -amt,
                fee: 0,
                balanceBefore: balBeforeSource,
                balanceAfter: balAfterSource,
                description: `Transfer to ${toWallet}`,
                transactionId: `${trxId}_OUT`,
                metadata: { from: fromWallet, to: toWallet }
            }], { session });

            // [LEDGER] Log Target Credit
            await TransactionLedger.create([{
                userId,
                type: 'transfer_in',
                amount: creditAmount,
                fee: fee,
                balanceBefore: balBeforeTarget,
                balanceAfter: balAfterTarget,
                description: `Transfer from ${fromWallet}`,
                transactionId: `${trxId}_IN`,
                metadata: { from: fromWallet, to: toWallet }
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

            // Fetch Before
            const checkUser = await User.findById(userId).select(dbKey).session(session);
            if (!checkUser) throw new Error('User not found');

            const getVal = (obj, path) => path.split('.').reduce((o, i) => o ? o[i] : 0, obj);
            const balBefore = getVal(checkUser, dbKey) || 0;

            const user = await User.findOneAndUpdate(
                { _id: userId, [dbKey]: { $gte: amt } },
                { $inc: { [dbKey]: -amt } },
                { new: true, session }
            );
            if (!user) throw new Error('Insufficient Balance');

            const balAfter = getVal(user, dbKey);

            // [LEDGER]
            await TransactionLedger.create([{
                userId,
                type: 'debit',
                amount: -amt,
                fee: 0,
                balanceBefore: balBefore,
                balanceAfter: balAfter,
                description: reason,
                transactionId: `DBT_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            }], { session });

            // [AGENT GUARD]
            if (walletType === 'agent' || walletType === 'wallet.agent') {
                if (balAfter < 500) {
                    console.log(`[AGENT GUARD] Low Stock Alert: ${user.username} ($${balAfter})`);
                    // Notify Super Admin (Async, don't block txn)
                    NotificationService.sendToRole('super_admin',
                        `⚠️ Low Agent Stock Alert: ${user.username} has $${balAfter.toFixed(2)} left.`,
                        'warning'
                    ).catch(e => console.error(e));
                }
            }

            return user;
        });
    }

    // Atomic Add Helper
    static async addBalance(userId, amount, walletType = 'main', reason = 'Operation') {
        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const amt = parseFloat(amount);
            const dbKey = WalletService.getDBKey(walletType);

            const checkUser = await User.findById(userId).select(dbKey).session(session);
            const getVal = (obj, path) => path.split('.').reduce((o, i) => o ? o[i] : 0, obj);
            const balBefore = getVal(checkUser, dbKey) || 0;

            const user = await User.findByIdAndUpdate(
                userId,
                { $inc: { [dbKey]: amt } },
                { new: true, session }
            );

            const balAfter = getVal(user, dbKey);

            // [LEDGER]
            await TransactionLedger.create([{
                userId,
                type: 'credit',
                amount: amt,
                fee: 0,
                balanceBefore: balBefore,
                balanceAfter: balAfter,
                description: reason,
                transactionId: `CDT_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            }], { session });

            return user;
        });
    }

    // Send Money (P2P)
    static async sendMoney(senderId, amount, recipientPhone) {
        return await runTransaction(async (session) => {
            const parsedAmount = parseFloat(amount);

            // Logic: Deduct from Income (w_dat.i) first, then Main (w_dat.m)
            const sender = await User.findById(senderId).session(session);
            const recipient = await User.findOne({ primary_phone: recipientPhone }).session(session);

            if (!sender) throw new Error('Sender not found');
            if (!recipient) throw new Error('Recipient not found');
            if (sender.id === recipient.id) throw new Error('Cannot send to self');

            // Virtuals or Direct Access
            const income = sender.wallet.income || 0;
            const main = sender.wallet.main || 0;
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

            // Perform Atomic Updates
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

            // [LEDGER] Log Debits
            const trxId = `P2P_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            if (deductIncome > 0) {
                await TransactionLedger.create([{
                    userId: senderId,
                    type: 'send_money',
                    amount: -deductIncome,
                    fee: 0,
                    balanceBefore: income,
                    balanceAfter: (updatedSender.wallet.income || 0),
                    description: `P2P Send to ${recipientPhone} (Income)`,
                    transactionId: `${trxId}_INC`,
                    metadata: { recipient: recipient.id }
                }], { session });
            }

            if (deductMain > 0) {
                await TransactionLedger.create([{
                    userId: senderId,
                    type: 'send_money',
                    amount: -deductMain,
                    fee: 0,
                    balanceBefore: main,
                    balanceAfter: (updatedSender.wallet.main || 0),
                    description: `P2P Send to ${recipientPhone} (Main)`,
                    transactionId: `${trxId}_MAIN`,
                    metadata: { recipient: recipient.id }
                }], { session });
            }

            // Create UI Transaction
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
            // Check for duplicate TrxID on Active Transactions
            const exists = await Transaction.findOne({ transactionId });
            if (exists) throw new Error('Transaction ID already used.');

            const transaction = await Transaction.create({
                userId,
                type: 'add_money',
                amount: parseFloat(amount),
                status: 'pending',
                recipientDetails: recipientDetails || `Method: ${method}`,
                transactionId: transactionId,
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
