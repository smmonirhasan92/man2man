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
                description: 'Agent Stock Transfer'
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
        const { amount, method, transactionId, recipientDetails, receivedByAgentId } = req.body;

        if (!transactionId || transactionId.length < 8) {
            return res.status(400).json({ message: 'Valid Transaction ID (TrxID) is required.' });
        }

        const result = await WalletService.requestRecharge(
            req.user.user.id, amount, method, transactionId, recipientDetails, receivedByAgentId, null // No proofImage
        );
        res.status(201).json({ message: 'Deposit Request Submitted', transaction: result });
    } catch (err) {
        console.error('Recharge Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message }); // Exposed for debugging
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

        // [COOLDOWN] Redis Lock (5 Seconds)
        const { client } = require('../../config/redis');
        if (client.isOpen) {
            const lockKey = `lock:swap:${userId}`;
            const isLocked = await client.get(lockKey);
            if (isLocked) {
                return res.status(429).json({ message: "Please wait 5 seconds between swaps." });
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