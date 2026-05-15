const User = require('../user/UserModel');
const WalletService = require('./WalletService');
const WithdrawalService = require('./WithdrawalService');
const Transaction = require('./TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const TurnoverService = require('./TurnoverService');
const CURRENCY = require('../../config/currency');

// Get User Wallet Data
exports.getWallet = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const data = await WalletService.getBalance(userId);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Send Money (P2P Send)
exports.sendMoney = async (req, res) => {
    try {
        const { recipientPhone, amount } = req.body;
        const senderId = req.user.user.id;
        const result = await WalletService.sendMoney(senderId, recipientPhone, amount, req.ip);
        res.json(result);
    } catch (err) {
        console.error('SendMoney Error:', err);
        res.status(400).json({ message: err.message || 'Transfer Failed' });
    }
};
exports.transferMoney = exports.sendMoney;

// Request Withdrawal (STRICT: MAIN WALLET ONLY)
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, accountDetails, deliveryTime } = req.body;
        const amountFloat = parseFloat(amount);

        if (isNaN(amountFloat) || amountFloat <= 0) {
            return res.status(400).json({ message: 'Invalid Amount' });
        }

        // [v8.5] Strict Minimum $5 Limit (500 NXS)
        if (amountFloat < CURRENCY.TRANSFER_MINIMUM_NXS) {
            return res.status(400).json({ 
                message: `সর্বনিম্ন উইথড্র সীমা ${CURRENCY.TRANSFER_MINIMUM_NXS} NXS ($৫.০০ USD)।` 
            });
        }

        const txn = await WithdrawalService.requestWithdrawal(
            req.user.user.id,
            amountFloat,
            method,
            accountDetails,
            'standard', 
            null, 
            req.body.idempotencyKey,
            deliveryTime || '24h'
        );

        res.status(201).json({
            message: 'Withdrawal Request Submitted',
            transaction: txn
        });
    } catch (err) {
        console.error("[Withdrawal Failed] Error:", err.message);
        res.status(400).json({ message: err.message || 'Withdrawal Failed' });
    }
};

// Request Recharge
exports.requestRecharge = async (req, res) => {
    try {
        const { amount, method, transactionId, recipientDetails, receivedByAgentId, status } = req.body;
        const targetStatus = status || 'pending';
        if (targetStatus !== 'pending_instructions') {
            if (!transactionId || transactionId.length < 8) {
                return res.status(400).json({ message: 'Valid Transaction ID (TrxID) is required.' });
            }
        }
        const result = await WalletService.requestRecharge(req.user.user.id, amount, method, transactionId, recipientDetails, receivedByAgentId, null, req.ip, targetStatus);
        res.status(201).json({ message: 'Deposit Request Submitted', transaction: result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Transfer Income Balance to Main Wallet
exports.transferToMain = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.user.id;
        const amountFloat = parseFloat(amount);

        if (isNaN(amountFloat) || amountFloat <= 0) return res.status(400).json({ message: "Invalid Amount" });

        const CURRENCY = require('../../config/currency');

        if (amountFloat < CURRENCY.TRANSFER_MINIMUM_NXS) {
            return res.status(400).json({ 
                success: false, 
                message: `⚠️ সর্বনিম্ন ট্রান্সফার সীমা ${CURRENCY.TRANSFER_MINIMUM_NXS} NXS ($৫.০০ USD)।` 
            });
        }

        const { client } = require('../../config/redis');
        if (client.isOpen) {
            const lockKey = `lock:swap:${userId}`;
            const isLocked = await client.get(lockKey);
            if (isLocked) return res.status(429).json({ message: "⏳ অনুগ্রহ করে ৫ সেকেন্ড অপেক্ষা করুন।" });
            await client.setEx(lockKey, 5, 'LOCKED');
        }

        const result = await WalletService.transferFunds(userId, amountFloat, 'income', 'main', 'Swap Income to Main');
        res.json({
            success: true,
            message: 'Transferred to Main Wallet',
            newIncomeBalance: result.newBalances.income,
            newMainBalance: result.newBalances.main
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Transfer Income to Purchase
exports.transferToPurchase = async (req, res) => {
    try {
        const result = await WalletService.transferFunds(req.user.user.id, req.body.amount, 'income', 'purchase', 'Income to Purchase Wallet');
        res.json({ success: true, message: 'Transferred to Purchase Wallet' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Mobile Recharge (Legacy Redirect)
exports.mobileRecharge = exports.requestWithdrawal;

// [P2P FLOW] Step 2: Admin provides Bkash/Nagad number
exports.provideInstructions = async (req, res) => {
    try {
        const { transactionId, adminInstructions } = req.body;
        if (!transactionId || !adminInstructions) {
            return res.status(400).json({ message: 'Transaction ID and Payment Number are required' });
        }
        const result = await WalletService.provideInstructions(transactionId, adminInstructions);
        const SocketService = require('../common/SocketService');
        if (result && result.userId) {
            SocketService.broadcast(`user_${result.userId}`, 'transaction_update', { 
                transactionId, 
                status: 'awaiting_payment',
                message: 'Payment instructions received!'
            });
        }
        res.json({ message: 'আপনার পেমেন্ট ইনস্ট্রাকশন ইউজারের কাছে পাঠানো হয়েছে।', transaction: result });
    } catch (err) {
        console.error('ProvideInstructions CRASH:', err);
        res.status(500).json({ message: 'সার্ভার এরর!', stack: err.stack });
    }
};

// [P2P FLOW] Step 3: User submits proof of payment
exports.submitProof = async (req, res) => {
    try {
        const { transactionId, proofTxID } = req.body;
        const proofImage = req.file ? req.file.path : null;
        if (!transactionId || (!proofTxID && !proofImage)) {
            return res.status(400).json({ message: 'Transaction ID and either TxID or Screenshot is required' });
        }
        const result = await WalletService.submitProof(transactionId, proofTxID, proofImage);
        const SocketService = require('../common/SocketService');
        SocketService.broadcast('admin_dashboard', 'transaction_update', { 
            transactionId, 
            status: 'final_review',
            message: 'New payment proof submitted!'
        });
        res.json({ message: 'Proof submitted for review', transaction: result });
    } catch (err) {
        console.error('SubmitProof Error:', err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Load Purchase Wallet (Main -> Purchase)
exports.loadPurchaseWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await WalletService.transferFunds(req.user.user.id, amount, 'main', 'purchase', 'Main Wallet to Purchase Wallet');
        res.json({ message: 'Transfer Successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Take Loan
exports.takeLoan = async (req, res) => {
    try {
        const result = await WalletService.takeLoan(req.user.user.id);
        res.json({ success: true, message: 'Loan Added', transaction: result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
