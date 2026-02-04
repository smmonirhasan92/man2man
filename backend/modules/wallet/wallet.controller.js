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
        const amountFloat = parseFloat(amount);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            return res.status(400).json({ message: "Invalid Amount" });
        }

        // [LOGIC] Apply Tax & Fees for Cross-Border (Income USD -> Main BDT)
        // USA Tax: 10%, Exchange Fee: 3%
        const TAX_RATE = 0.10;
        const EXCH_FEE = 0.03;
        const EXCHANGE_RATE = 120.65; // USD to BDT

        const taxAmount = amountFloat * TAX_RATE;
        const feeAmount = amountFloat * EXCH_FEE;
        // Net USD after fees
        const netUsd = amountFloat - taxAmount - feeAmount;

        // Convert Net USD to BDT
        const netBdt = Math.round((netUsd * EXCHANGE_RATE) * 100) / 100;

        // Perform Transfer
        // Use top-level imports or correct relative paths
        // Since we are in /modules/wallet/wallet.controller.js:
        const TransactionHelper = require('../common/TransactionHelper');
        const User = require('../user/UserModel');
        const Transaction = require('./TransactionModel');

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(req.user.user.id).session(session);
            if (!user) throw new Error("User not found");

            if ((user.wallet.income || 0) < amountFloat) {
                throw new Error("Insufficient Income Balance");
            }

            // Deduct GROSS from Income (USD)
            user.wallet.income -= amountFloat;

            // Add NET to Main (BDT)
            user.wallet.main = (user.wallet.main || 0) + netBdt;

            await user.save({ session });

            // [LOG 1] Debit from Income (Gross) - USD
            await Transaction.create([{
                userId: user._id,
                type: 'wallet_transfer',
                amount: -amountFloat,
                status: 'completed',
                description: 'Transfer from Income Wallet',
                metadata: {
                    currency: 'USD',
                    target: 'main'
                }
            }], { session });

            // [LOG 2] Credit to Main (Net) - BDT
            await Transaction.create([{
                userId: user._id,
                type: 'wallet_transfer',
                amount: netBdt,
                status: 'completed',
                description: 'Income to Main Wallet (Net)',
                metadata: {
                    grossAmount: amountFloat,
                    tax: taxAmount,
                    fee: feeAmount,
                    exchangeRate: EXCHANGE_RATE,
                    netUsd: netUsd
                }
            }], { session });

            return {
                newIncome: user.wallet.income,
                newMain: user.wallet.main,
                receipt: {
                    amount: amountFloat,
                    tax: taxAmount,
                    fee: feeAmount,
                    finalAmount: netBdt,
                    currency: 'BDT',
                    rate: EXCHANGE_RATE
                }
            };
        });

        res.json({
            success: true,
            message: 'Transferred to Main Wallet',
            newIncomeBalance: result.newIncome,
            newMainBalance: result.newMain,
            receipt: result.receipt
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

// Transfer to Game Wallet (Main -> Game)
exports.transferToGame = async (req, res) => {
    try {
        const { amount } = req.body;
        const GameWallet = require('./GameWalletModel');
        const Transaction = require('./TransactionModel'); // Ensure this is imported
        const userId = req.user.user.id;

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            const amountFloat = parseFloat(amount);
            if (isNaN(amountFloat) || amountFloat <= 0) throw new Error("Invalid amount");

            // Check Main Balance (BDT)
            if ((user.wallet.main || 0) < amountFloat) throw new Error("Insufficient Main Balance");

            // Deduct from Main
            user.wallet.main -= amountFloat;

            // Add to Game Wallet (Directly on User)
            user.wallet.game = (user.wallet.game || 0) + amountFloat;
            user.game_balance = user.wallet.game; // Sync legacy field if exists

            await user.save({ session });

            // Log Transaction (Main Output)
            await Transaction.create([{
                userId,
                type: 'wallet_transfer',
                amount: -amountFloat,
                status: 'completed',
                description: 'Transfer to Game Wallet',
                metadata: { currency: 'BDT', target: 'game' }
            }], { session });

            return {
                message: 'Transferred to Game Wallet',
                newMainBalance: user.wallet.main,
                newGameBalance: user.wallet.game
            };
        });

        res.json(result);

    } catch (err) {
        console.error(err);
        if (err.message.includes('Insufficient') || err.message.includes('Invalid')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Withdraw Game Funds (Game -> Main)
exports.withdrawGameFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.user.id;

        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            const amountFloat = parseFloat(amount);
            if (isNaN(amountFloat) || amountFloat <= 0) throw new Error("Invalid amount");

            // Check Game Balance (Directly on User)
            if ((user.wallet.game || 0) < amountFloat) throw new Error("Insufficient Game Balance");

            // Deduct Game
            user.wallet.game -= amountFloat;
            user.game_balance = user.wallet.game; // Sync legacy

            // Credit Main
            user.wallet.main = (user.wallet.main || 0) + amountFloat;

            await user.save({ session });

            // Log Transaction
            await Transaction.create([{
                userId,
                type: 'wallet_transfer', // Changed from game_win for consistency? or keep game_win? 'wallet_transfer' is safer for general swap. 
                amount: amountFloat,
                status: 'completed',
                description: 'Withdraw from Game Wallet',
                metadata: { currency: 'BDT', source: 'game', target: 'main' }
            }], { session });

            return {
                success: true,
                message: 'Transferred to Main Wallet',
                newMainBalance: user.wallet.main,
                newGameBalance: user.wallet.game
            };
        });

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// [NEW] Swap Wallet Delegate
exports.swapWallet = async (req, res) => {
    try {
        const { direction } = req.body;
        if (direction === 'main_to_game') {
            return exports.transferToGame(req, res);
        }
        if (direction === 'game_to_main') {
            return exports.withdrawGameFunds(req, res);
        }
        return res.status(400).json({ message: "Invalid Swap Direction" });
    } catch (e) {
        console.error("Swap Error:", e);
        res.status(500).json({ message: "Swap Failed" });
    }
};