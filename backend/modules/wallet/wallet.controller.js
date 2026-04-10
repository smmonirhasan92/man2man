const WalletService = require('./WalletService');
const TransactionHelper = require('../common/TransactionHelper');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const mongoose = require('mongoose');

// Swap Wallet moved to bottom or implemented via transfer functions


// Get User Balances (USA Affiliate Marketing v2.0)
exports.getWallet = async (req, res) => {
    try {
        const balances = await WalletService.getBalance(req.user.user.id);
        res.json(balances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// P2P Transfer: Income -> Purchase (User to User)
// Send Money (P2P / Cash Out Request) -> Now PENDING by default
// UPDATED: Agent Stock Transfer (Agent Stock -> User Main)
exports.transferMoney = async (req, res) => {
    try {
        const { amount, recipientPhone } = req.body;

        // Restriction: Only Agents can send money (Sell Stock)
        if (req.user.user.role !== 'agent') {
            return res.status(403).json({ message: 'Access Denied. Only Agents can send money.' });
        }

        await TransactionHelper.runTransaction(async (session) => {
            const opts = session ? { session } : {}; // Safe options

            const sender = await User.findById(req.user.user.id).setOptions(opts);
            const recipient = await User.findOne({ primary_phone: recipientPhone }).setOptions(opts);

            if (!recipient) throw new Error('Recipient not found');
            if (sender._id.equals(recipient._id)) throw new Error('Cannot send to self');

            const amountFloat = parseFloat(amount);
            if ((sender.wallet.agent || 0) < amountFloat) throw new Error('Insufficient Stock Balance');

            // Deduct Stock
            sender.wallet.agent -= amountFloat;
            await sender.save(opts);

            // Credit User Main
            recipient.wallet.main = (recipient.wallet.main || 0) + amountFloat;
            await recipient.save(opts);

            // Logs
            await Transaction.create([{
                userId: sender._id,
                type: 'send_money',
                amount: -amountFloat,
                status: 'completed',
                recipientDetails: `Sent to ${recipient.phone}`,
                description: 'Agent Stock Transfer',
                metadata: { ip: req.ip }
            }, {
                userId: recipient._id,
                type: 'add_money',
                amount: amountFloat,
                status: 'completed',
                recipientDetails: `Received from ${sender.username}`,
                description: 'P2P Transfer Received'
            }], opts);
        });

        res.json({ message: 'Transfer Successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Alias for Send Money (Frontend uses /send -> sendMoney)
exports.sendMoney = exports.transferMoney;

// Request Withdrawal
exports.requestWithdrawal = async (req, res) => {
    try {
        const { amount, method, details, deliveryTime, walletType } = req.body; // walletType = 'income'
        const WithdrawalService = require('./WithdrawalService');

        const txn = await WithdrawalService.requestWithdrawal(
            req.user.user.id,
            parseFloat(amount),
            method,
            details,
            'standard', // tier (legacy)
            null, // agentId
            req.body.idempotencyKey,
            deliveryTime || '24h',
            walletType || 'income' // Source
        );

        res.status(201).json({
            message: 'Withdrawal Request Submitted',
            transaction: txn
        });
    } catch (err) {
        console.error("[Withdrawal Failed] Error:", err.message);
        console.error("Payload:", req.body);
        res.status(400).json({ message: err.message || 'Withdrawal Failed' });
    }
};

// Mobile Recharge (Legacy Redirect)
exports.mobileRecharge = exports.requestWithdrawal;

// Request Recharge
exports.requestRecharge = async (req, res) => {
    try {
        const { amount, method, transactionId, recipientDetails, receivedByAgentId, status } = req.body;

        // Relax TrxID for P2P Hub (Initial status: pending_instructions)
        const targetStatus = status || 'pending';
        if (targetStatus !== 'pending_instructions') {
            if (!transactionId || transactionId.length < 8) {
                return res.status(400).json({ message: 'Valid Transaction ID (TrxID) is required.' });
            }
        }

        const result = await WalletService.requestRecharge(
            req.user.user.id, amount, method, transactionId, recipientDetails, receivedByAgentId, null, req.ip, targetStatus
        );
        res.status(201).json({ message: 'Deposit Request Submitted', transaction: result });
    } catch (err) {
        console.error('Recharge Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message }); // Exposed for debugging
    }
};

// [P2P FLOW] Step 2: Admin provides Bkash/Nagad number
exports.provideInstructions = async (req, res) => {
    try {
        const { transactionId, adminInstructions } = req.body;
        if (!transactionId || !adminInstructions) {
            return res.status(400).json({ message: 'Transaction ID and Payment Number are required' });
        }

        const result = await WalletService.provideInstructions(transactionId, adminInstructions);
        
        // 3. Emit Real-time Update to User Room
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
        res.status(500).json({ message: 'সার্ভার এরর! ইনস্ট্রাকশন পাঠানো সম্ভব হচ্ছে না।', stack: err.stack });
    }
};

// [P2P FLOW] Step 3: User submits proof of payment (TxID/Image)
exports.submitProof = async (req, res) => {
    try {
        const { transactionId, proofTxID } = req.body;
        const proofImage = req.file ? req.file.path : null;

        if (!transactionId || (!proofTxID && !proofImage)) {
            return res.status(400).json({ message: 'Transaction ID and either TxID or Screenshot is required' });
        }

        const result = await WalletService.submitProof(transactionId, proofTxID, proofImage);
        
        // 3. Emit Real-time Update to Admin Room
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

// Transfer Income Balance to Main Wallet
exports.transferToMain = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.user.id; // Corrected ID access
        const amountFloat = parseFloat(amount);

        if (isNaN(amountFloat) || amountFloat <= 0) {
            return res.status(400).json({ message: "Invalid Amount" });
        }

        const CURRENCY = require('../../config/currency');

        // [v6.5] Financial Hardening: $5 Minimum Limit (Scaled to 1 Cent model)
        if (amountFloat < CURRENCY.TRANSFER_MINIMUM_NXS) {
            return res.status(400).json({ 
                success: false, 
                message: `⚠️ সর্বনিম্ন ট্রান্সফার সীমা ${CURRENCY.TRANSFER_MINIMUM_NXS} NXS ($৫.০০ USD)। অনুগ্রহ করে আরও ইনকাম জমা করুন।` 
            });
        }

        // [COOLDOWN] Redis Lock (5 Seconds)
        const { client } = require('../../config/redis');
        if (client.isOpen) {
            const lockKey = `lock:swap:${userId}`;
            const isLocked = await client.get(lockKey);
            if (isLocked) {
                return res.status(429).json({ message: "⏳ অনুগ্রহ করে ৫ সেকেন্ড অপেক্ষা করুন। বারবার সোয়াপ (Swap) করার চেষ্টা করবেন না।" });
            }
            await client.setEx(lockKey, 5, 'LOCKED');
        }

        // [LOGIC] Delegate to WalletService (Unified Ledger)
        // WalletService.transferFunds handles the 3% Fee automatically for Income->Main
        const WalletService = require('./WalletService');
        const result = await WalletService.transferFunds(
            userId,
            amountFloat,
            'income',
            'main',
            'Swap Income to Main'
        );

        res.json({
            success: true,
            message: 'Transferred to Main Wallet',
            newIncomeBalance: result.newBalances.income,
            newMainBalance: result.newBalances.main,
            fee: result.fee,
            creditAmount: result.creditAmount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Transfer Income Balance to Purchase Wallet
exports.transferToPurchase = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await WalletService.transferFunds(req.user.user.id, amount, 'income', 'purchase', 'Income to Purchase Wallet');
        res.json({
            success: true,
            message: 'Transferred to Purchase Wallet',
            newIncomeBalance: result.newBalances.income,
            newPurchaseBalance: result.newBalances.purchase
        });
    } catch (err) {
        console.error(err);
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

// End of Wallet Controller