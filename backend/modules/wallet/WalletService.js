const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const TransactionLedger = require('./TransactionLedgerModel'); // [NEW] Unified Ledger
const SystemSetting = require('../settings/SystemSettingModel');
const NotificationService = require('../notification/NotificationService'); // [NEW] For Agent Alert

const { runTransaction } = require('../common/TransactionHelper');

class WalletService {
    
    /**
     * [LOAN RECOVERY] 
     * Auto-deduct excess from MAIN wallet if > 100 NXS to pay off loan.
     * This ensures any source (Tasks, Games, Deposit) helps repay the circular debt.
     */
    static async processLoanRecovery(userId, session) {
        try {
            const user = await User.findById(userId).select('wallet is_loan_active').session(session);
            const loanDue = user?.wallet?.loan_due || 0;
            if (!user || !user.is_loan_active || loanDue <= 0) return;

            const mainBalance = user.wallet.main || 0;
            const THRESHOLD = 100; // Keep at least 100 in wallet for user interaction

            if (mainBalance > THRESHOLD) {
                const availableForRecovery = mainBalance - THRESHOLD;
                const deduction = Math.min(availableForRecovery, loanDue);

                if (deduction > 0) {
                    const remainingLoan = loanDue - deduction;
                    const updates = {
                        $inc: {
                            'wallet.main': -deduction,
                            'wallet.loan_due': -deduction
                        }
                    };

                    if (remainingLoan <= 0) {
                        updates.$set = { is_loan_active: false };
                    }

                    // Perform recovery
                    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true, session });

                    // Log Transaction
                    await Transaction.create([{
                        userId: userId,
                        type: 'loan_repayment',
                        amount: -deduction,
                        status: 'completed',
                        description: `Automatic Loan Repayment (Main balance over 100 NXS)`,
                        metadata: { remainingLoan: Math.max(0, remainingLoan), source: 'auto_recovery' }
                    }], { session, ordered: true });

                    // [SOCKET] Notify of recovery
                    try {
                        const SocketService = require('../common/SocketService');
                        SocketService.emitToUser(userId, 'wallet_update', updatedUser.wallet);
                        SocketService.emitToUser(userId, 'loan_recovery_update', { 
                            deducted: deduction, 
                            remaining: Math.max(0, remainingLoan),
                            message: `${deduction} NXS has been automatically recovered for loan repayment.`
                        });
                    } catch (e) {}

                    console.log(`[LoanRecovery] User ${userId}: Deducted ${deduction} NXS from MAIN`);
                }
            }
        } catch (err) {
            console.error('[LoanRecovery] Failed:', err.message);
        }
    }

    // Helper to map Friendly Names -> DB Keys (De-obfuscated)
    static getDBKey(walletType) {
        const map = {
            'main': 'wallet.main',
            // 'game': 'wallet.game', removed
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
            // game_balance and game_locked removed
            // [SYNC] Frontend Obfuscated Access
            w_dat: {
                m_v: user.wallet.main || 0,
                // g_v removed
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

        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const rawAmt = parseFloat(amount);
            if (isNaN(rawAmt) || rawAmt <= 0) throw new Error('Invalid Amount');
            const amt = parseFloat(rawAmt.toFixed(4));

            // [TURNOVER TRAP CHECK] - Removed for Game Purge

            // Fee Logic: Apply 2% Fee ONLY for Income -> Main
            let fee = 0;
            let creditAmount = amt;
            let feeDescription = '';

            if (fromWallet === 'income' && (toWallet === 'main' || toWallet === 'wallet.main')) {
                fee = amt * 0.02; // 2%
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

            // 2. Perform Atomic Swap in a single operation
            const user = await User.findOneAndUpdate(
                { _id: userId, [sourceKey]: { $gte: amt } },
                {
                    $inc: {
                        [sourceKey]: -amt,
                        [targetKey]: creditAmount
                    }
                },
                { new: true, session }
            );

            if (!user) {
                // Determine if it was total balance failure or race condition
                const verifyUser = await User.findById(userId).select(sourceKey).session(session);
                const currentBalance = getVal(verifyUser, sourceKey) || 0;
                throw new Error(`Transfer Failed: Insufficient balance (Available: ${currentBalance}, Required: ${amt})`);
            }

            // Get New Balances after update
            const balAfterSource = getVal(user, sourceKey);
            const balAfterTarget = getVal(user, targetKey);

            const trxId = `TRX_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

            // 3. Log transactions
            await Transaction.create([{
                userId,
                type: 'wallet_transfer',
                amount: amt,
                status: 'completed',
                description: (description || `${fromWallet} to ${toWallet}`) + feeDescription,
                recipientDetails: 'Self Transfer',
                balanceAfter: user.wallet.main,
                fee: fee
            }], { session, ordered: true });

            await TransactionLedger.create([{
                userId,
                type: 'transfer_out',
                amount: -amt,
                fee: 0,
                balanceBefore: balBeforeSource,
                balanceAfter: balAfterSource,
                description: `Transfer to ${toWallet}`,
                transactionId: `${trxId}_OUT`
            }, {
                userId,
                type: 'transfer_in',
                amount: amt, // [FIX] Must pass gross amount here so pre-save integrity check (amt - fee) resolves correctly
                fee: fee,
                balanceBefore: balBeforeTarget,
                balanceAfter: balAfterTarget,
                description: `Transfer from ${fromWallet}`,
                transactionId: `${trxId}_IN`
            }], { session, ordered: true });

            if (fee > 0) {
                await Transaction.create([{
                    userId,
                    type: 'fee',
                    amount: -fee,
                    status: 'completed',
                    description: `Exchange Fee (2%) - ${fromWallet} to ${toWallet}`,
                    recipientDetails: 'System'
                }], { session, ordered: true });
            }

            // [SOCKET] Real-time User Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(userId, 'wallet_update', {
                    main: user.wallet.main,
                    income: user.wallet.income,
                    purchase: user.wallet.purchase,
                    agent: user.wallet.agent
                });
            } catch (e) { }

            // [CACHE] Invalidate Redis User Cache
            try {
                const redisConfig = require('../../config/redis');
                if (redisConfig.client.isOpen) {
                    await redisConfig.client.del(`user_profile:${userId}`);
                }
            } catch (e) { }

            // [LOAN RECOVERY] Trigger check after transfer if target is MAIN
            if (toWallet === 'main' || toWallet === 'wallet.main') {
                await WalletService.processLoanRecovery(userId, session);
            }

            return { success: true, newBalances: user.wallet, fee, creditAmount };
        });
    }

    // Atomic Deduction Helper
    static async deductBalance(userId, amount, walletType = 'main', reason = 'Operation') {
        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const rawAmt = parseFloat(amount);
            if (isNaN(rawAmt) || rawAmt <= 0) throw new Error('Invalid Deduction Amount');
            const amt = parseFloat(rawAmt.toFixed(4));
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
            }], { session, ordered: true });

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

            // [SOCKET] Real-time User Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(userId, 'wallet_update', {
                    main: user.wallet.main,
                    income: user.wallet.income,
                    purchase: user.wallet.purchase,
                    agent: user.wallet.agent
                });
            } catch (e) { }

            return user;
        });
    }

    // Atomic Add Helper
    static async addBalance(userId, amount, walletType = 'main', reason = 'Operation') {
        const TransactionHelper = require('../common/TransactionHelper');
        return await TransactionHelper.runTransaction(async (session) => {
            const rawAmt = parseFloat(amount);
            if (isNaN(rawAmt) || rawAmt <= 0) throw new Error('Invalid Add Amount');
            const amt = parseFloat(rawAmt.toFixed(4));
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
            }], { session, ordered: true });

            // [SOCKET] Real-time User Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(userId, 'wallet_update', {
                    main: user.wallet.main,
                    income: user.wallet.income,
                    purchase: user.wallet.purchase,
                    agent: user.wallet.agent
                });
            } catch (e) { }

            // [LOAN RECOVERY] Trigger check after adding funds
            await WalletService.processLoanRecovery(userId, session);

            return user;
        });
    }

    // [NEW] B2B Direct Send using Secret Account ID & PIN
    static async b2bSend(senderId, amount, nxsAccountId, pin) {
        const { runTransaction } = require('../common/TransactionHelper');
        const bcrypt = require('bcryptjs');

        return await runTransaction(async (session) => {
            const parsedAmount = parseFloat(amount);
            if (parsedAmount < 900) throw new Error('Minimum send amount is 900 NXS ($9).');
            if (parsedAmount % 100 !== 0) throw new Error('Send amount must be a multiple of 100 NXS.');

            // 1. Find Sender & Validate Password
            const sender = await User.findById(senderId).select('+password wallet').session(session);
            if (!sender) throw new Error('Sender not found.');
            if (!sender.password) throw new Error('Password not set on your account.');
            
            const isPinValid = await bcrypt.compare(pin, sender.password);
            if (!isPinValid) throw new Error('Invalid Login Password.');

            // 2. Find Recipient by Secret ID
            const recipient = await User.findOne({ nxsAccountId: nxsAccountId.toUpperCase().trim() }).session(session);
            if (!recipient) throw new Error('Recipient ID not found. Please check and try again.');
            if (sender._id.equals(recipient._id)) throw new Error('Cannot send to yourself.');

            // 3. Fee & Balance Calculation
            const fee = parsedAmount * 0.05; // 5%
            const totalDeduction = parsedAmount + fee;
            const RESERVE_LIMIT = 50;

            if (sender.wallet.main < (totalDeduction + RESERVE_LIMIT)) {
                throw new Error(`Insufficient Main Balance. Need ${totalDeduction} NXS + ${RESERVE_LIMIT} NXS reserve.`);
            }

            // 4. Atomic Updates
            const updatedSender = await User.findOneAndUpdate(
                { _id: senderId, 'wallet.main': { $gte: totalDeduction } },
                { $inc: { 'wallet.main': -totalDeduction } },
                { new: true, session }
            );

            if (!updatedSender) throw new Error('Balance update failed. Please try again.');

            const updatedRecipient = await User.findOneAndUpdate(
                { _id: recipient._id },
                { $inc: { 'wallet.main': parsedAmount } },
                { new: true, session }
            );

            // 5. Admin Fee Route
            await SystemSetting.findOneAndUpdate(
                { key: 'admin_reserve_fund' },
                { $inc: { value: fee } },
                { upsert: true, session }
            );

            // 6. Logs & Ledger
            const trxId = `B2B_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            // Sender Transaction Record
            await Transaction.create([{
                userId: senderId,
                type: 'b2b_send',
                amount: -parsedAmount,
                fee: fee,
                status: 'completed',
                description: `B2B Send to ${recipient.username} (${recipient.nxsAccountId})`,
                recipientDetails: recipient.nxsAccountId
            }], { session, ordered: true });

            if (fee > 0) {
                await Transaction.create([{
                    userId: senderId,
                    type: 'fee',
                    amount: -fee,
                    status: 'completed',
                    description: `P2P Transfer Fee (5%)`,
                    recipientDetails: 'System'
                }], { session, ordered: true });
            }

            // Recipient Transaction Record
            await Transaction.create([{
                userId: recipient._id,
                type: 'b2b_receive',
                amount: parsedAmount,
                status: 'completed',
                description: `B2B Received from ${sender.username}`,
                recipientDetails: sender.username
            }], { session, ordered: true });

            // Unified Ledger
            await TransactionLedger.create([{
                userId: senderId,
                type: 'debit',
                amount: -parsedAmount,
                fee: fee,
                balanceBefore: sender.wallet.main,
                balanceAfter: updatedSender.wallet.main,
                description: `B2B Out to ${recipient.nxsAccountId}`,
                transactionId: `${trxId}_OUT`
            }, {
                userId: recipient._id,
                type: 'credit',
                amount: parsedAmount,
                fee: 0,
                balanceBefore: recipient.wallet.main,
                balanceAfter: updatedRecipient.wallet.main,
                description: `B2B In from ${sender.username}`,
                transactionId: `${trxId}_IN`
            }], { session, ordered: true });

            // [SOCKET] Notify both
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(senderId, 'wallet_update', updatedSender.wallet);
                SocketService.emitToUser(senderId, 'notification', {
                    title: 'Transfer Successful',
                    message: `You successfully sent ${parsedAmount} NXS to ${recipient.username}`,
                    type: 'success'
                });
                SocketService.emitToUser(recipient._id, 'wallet_update', updatedRecipient.wallet);
                SocketService.emitToUser(recipient._id, 'notification', {
                    title: 'Payment Received!',
                    message: `You received ${parsedAmount} NXS from ${sender.username}`,
                    type: 'success'
                });
            } catch (e) {}

            return { success: true, amount: parsedAmount, fee, recipient: recipient.username };
        });
    }

    // Send Money (P2P) - VIP Card Restricted

    static async sendMoney(senderId, amount, recipientPhone, ip = 'unknown') {
        return await runTransaction(async (session) => {
            const parsedAmount = parseFloat(amount);
            if (parsedAmount < 900) throw new Error('Minimum send amount is $9.00 (900 NXS).');
            if (parsedAmount % 100 !== 0) throw new Error('Send amount must be a multiple of 100 NXS (e.g. 900, 1000, 1100).');

            const sender = await User.findById(senderId).session(session);
            const recipient = await User.findOne({ primary_phone: recipientPhone }).session(session);

            if (!sender) throw new Error('Sender not found');
            if (!recipient) throw new Error('Recipient not found');
            if (sender.id === recipient.id) throw new Error('Cannot send to self');

            // --- VIP CARD LIMIT CHECK ---
            const tier = sender.taskData?.accountTier || 'Starter';
            let monthlyLimit = 0;
            let txnLimit = 0;
            
            if (tier === 'Platinum' || tier === 'Diamond') {
                monthlyLimit = 10000; // $100
                txnLimit = 5000; // $50
            } else if (tier === 'Gold') {
                monthlyLimit = 3000; // $30
                txnLimit = 3000;
            } else if (tier === 'Silver') {
                monthlyLimit = 1500; // $15
                txnLimit = 1500;
            } else {
                throw new Error('You need at least a Silver VIP Membership to use P2P Send Money.');
            }

            if (parsedAmount > txnLimit) throw new Error(`Your ${tier} card limits sending to max ${txnLimit/100} USD per transaction.`);

            // Check current month usage
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            currentMonthStart.setHours(0,0,0,0);

            const monthlySends = await Transaction.aggregate([
                { $match: { userId: sender._id, type: 'send_money', createdAt: { $gte: currentMonthStart } } },
                { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
            ]).session(session);

            const sentThisMonth = monthlySends.length ? monthlySends[0].total : 0;
            if (sentThisMonth + parsedAmount > monthlyLimit) {
                throw new Error(`Monthly send limit exceeded. Your ${tier} card allows ${monthlyLimit/100} USD/mo.`);
            }

            // --- CALCULATION (5% Sender Fee) ---
            const fee = parsedAmount * 0.05;
            const totalDeduction = parsedAmount + fee;
            const RESERVE_LIMIT = 50; // Ensure they don't zero out completely

            const mainBalance = sender.wallet.main || 0;
            if (mainBalance - totalDeduction < RESERVE_LIMIT) {
                throw new Error(`Insufficient Main Balance. You need ${totalDeduction} NXS + ${RESERVE_LIMIT} NXS reserve.`);
            }

            // Perform Atomic Updates
            const updatedSender = await User.findOneAndUpdate(
                { _id: senderId, 'wallet.main': { $gte: totalDeduction } },
                { $inc: { 'wallet.main': -totalDeduction } },
                { new: true, session }
            );

            if (!updatedSender) throw new Error('Balance mismatch during processing');

            // --- BURN THE FEE ---
            await SystemSetting.findOneAndUpdate(
                { key: 'admin_reserve_fund' },
                { $inc: { value: fee } },
                { upsert: true, session }
            );

            // [LEDGER] Log Sender Debit
            const trxId = `P2P_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            await TransactionLedger.create([{
                userId: senderId,
                type: 'send_money',
                amount: -parsedAmount, // Visual gross
                fee: fee,
                balanceBefore: mainBalance,
                balanceAfter: updatedSender.wallet.main,
                description: `P2P Send to ${recipientPhone} (Main)`,
                transactionId: `${trxId}_OUT`,
                metadata: { recipient: recipient.id }
            }], { session, ordered: true });

            await Transaction.create([{
                userId: sender.id,
                type: 'send_money',
                amount: -parsedAmount, // Actual sent
                fee: fee,
                status: 'pending', // Pending Admin/System Approval
                recipientDetails: `Sent to: ${recipientPhone}`,
                relatedUserId: recipient.id,
                metadata: { ip }
            }], { session, ordered: true });

            return { message: 'Send Money Request Pending Approval. 5% fee charged.' };
        });
    }

    // Request Recharge (Add Money)
    static async requestRecharge(userId, amount, method, transactionId, recipientDetails, receivedByAgentId, proofImagePath, ip = 'unknown', status = 'pending') {
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) throw new Error("Invalid recharge amount");

        return await runTransaction(async (session) => {
            // Check for duplicate TrxID on Active Transactions (if provided)
            if (transactionId) {
                const exists = await Transaction.findOne({ transactionId }).session(session);
                if (exists) throw new Error('Transaction ID already used.');
            }

            // [BINANCE-STYLE] Lock Agent Escrow if Agent selected
            if (receivedByAgentId) {
                const agent = await User.findOneAndUpdate(
                    { _id: receivedByAgentId, 'wallet.main': { $gte: amt } },
                    { 
                        $inc: { 
                            'wallet.main': -amt,
                            'wallet.rechargeEscrow': amt 
                        } 
                    },
                    { session, new: true }
                );

                if (!agent) {
                    throw new Error("Agent does not have enough stock to handle this recharge.");
                }

                console.log(`[RECHARGE LOCK] Agent ${receivedByAgentId} locked ${amt} NXS for user ${userId}`);
            }

            const [transaction] = await Transaction.create([{
                userId,
                type: 'add_money',
                amount: amt,
                status: status || 'pending',
                recipientDetails: recipientDetails || `Method: ${method}`,
                transactionId: transactionId || undefined,
                proofImage: proofImagePath,
                assignedAgentId: receivedByAgentId || null,
                receivedByAgentId: receivedByAgentId || null
            }], { session, ordered: true });

            // [NEW] Real-time Admin Notification
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast('admin_dashboard', 'new_transaction_request', {
                    type: 'deposit',
                    amount: amt,
                    userId: userId,
                    message: `New Deposit Request: ${amt} NXS`
                });
            } catch (e) {
                console.error(`[SOCKET] Failed to broadcast deposit alert: ${e.message}`);
            }

            return transaction;
        });
    }

    static async provideInstructions(transactionId, adminInstructions) {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.status !== 'pending_instructions') throw new Error('Invalid transaction state');

        transaction.adminInstructions = adminInstructions;
        transaction.status = 'awaiting_payment';
        await transaction.save();

        return transaction;
    }

    static async submitProof(transactionId, proofTxID, proofImage) {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        if (transaction.status !== 'awaiting_payment') throw new Error('Invalid transaction state');

        if (proofTxID) transaction.proofTxID = proofTxID;
        if (proofImage) transaction.proofImage = proofImage;
        
        transaction.status = 'final_review';
        await transaction.save();

        return transaction;
    }
    // [NEW] Smart Loan System
    static async takeLoan(userId) {
        return await runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            // 1. Check if user already has an active loan
            if (user.is_loan_active || (user.wallet && user.wallet.loan_due > 0)) {
                throw new Error('You already have an active loan. Please repay it before requesting a new one.');
            }

            // 2. Grant Loan: 300 NXS
            const LOAN_AMOUNT = 300;
            user.wallet.main = (user.wallet.main || 0) + LOAN_AMOUNT;
            user.wallet.loan_due = LOAN_AMOUNT;
            user.is_loan_active = true;

            await user.save({ session });

            // [NEW] Distribute Loan Commission (6% Pool across 5 Levels)
            const ReferralService = require('../referral/ReferralService');
            await ReferralService.distributeLoanCommission(user._id, LOAN_AMOUNT, session);

            // 3. Log Transaction
            const txn = new Transaction({
                userId: user._id,
                type: 'add_money',
                amount: LOAN_AMOUNT,
                status: 'completed',
                description: 'Smart Loan Received',
                metadata: { is_loan: true }
            });
            await txn.save({ session });

            return txn;
        });
    }

}

module.exports = WalletService;
