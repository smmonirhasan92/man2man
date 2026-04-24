const mongoose = require('mongoose');
const P2POrder = require('./P2POrderModel');
const P2PTrade = require('./P2PTradeModel');
const P2PMessage = require('./P2PMessageModel');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const SocketService = require('../common/SocketService');
const NotificationService = require('../notification/NotificationService');
const systemEvents = require('../../utils/events');
const SystemSetting = require('../settings/SystemSettingModel');
const bcrypt = require('bcryptjs');

class P2PService {

    // --- 1. CREATE P2P AD (BUY or SELL Listing) ---
    async createOrder(userId, amount, paymentMethod, paymentDetails, rate = 123, type = 'SELL', fiatCurrency = 'USD', transactionType = 'SEND_MONEY') {
        if (amount <= 0) throw new Error("Invalid Limit Amount");

        // [AUTO-BOUNDARY] Dynamic Rate Limits for Large Transactions
        if (amount >= 1000) {
            const standardRate = 123; // System base rate ($1 = 123 BDT)
            const maxVariance = 5; // Maximum allowed difference (+/-)
            const minRate = standardRate - maxVariance;
            const maxRate = standardRate + maxVariance;

            if (rate < minRate || rate > maxRate) {
                throw new Error(`For orders of 1000 NXS ($10 USD) or more, the exchange rate must be strictly between ${minRate} BDT and ${maxRate} BDT.`);
            }
        } else {
            // Basic fallback for smaller orders (to prevent absolute madness like 5000)
            if (rate < 100 || rate > 150) {
                throw new Error(`The exchange rate must be between 100 BDT and 150 BDT to protect the marketplace.`);
            }
        }

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // If they are selling NXS, they must have NXS balance
        if (type === 'SELL') {
            if (user.wallet.main <= 0) throw new Error("Your Main Balance is zero. Cannot list a SELL Ad.");
            if (user.wallet.main < amount) throw new Error("Your limit cannot exceed your current Main Balance.");

            // --- DYNAMIC MINIMUM WITHDRAWAL THRESHOLD ---
            const PlanService = require('../plan/PlanService');
            const activePlans = await PlanService.getActivePlans(userId);
            let minWithdrawalUsd = 5; // System Default: $5

            if (activePlans && activePlans.length > 0) {
                const Plan = require('../../modules/admin/PlanModel');
                const planDetails = await Plan.findById(activePlans[0].planId);
                if (planDetails && planDetails.min_withdrawal) {
                    minWithdrawalUsd = planDetails.min_withdrawal;
                }
            }

            // [v7.0] Normalized: 100 NXS = $1.00 USD
            const minWithdrawalNxs = minWithdrawalUsd * 100;

            if (amount < minWithdrawalNxs) {
                throw new Error(`Minimum P2P Sell limit is ${minWithdrawalNxs} NXS ($${minWithdrawalUsd} USD) based on your current package.`);
            }
        }

        // Create Order (Listing)
        const order = await P2POrder.create({
            userId,
            type, // 'BUY' or 'SELL'
            amount, // Max Limit setting
            rate,
            fiatCurrency,
            paymentMethod,
            fiatCurrency,
            paymentMethod,
            paymentDetails,
            transactionType: transactionType || 'SEND_MONEY', // [NEW v3.0] Receiver's preference
            status: 'OPEN'
        });

        return order;
    }

    // --- 3. INITIATE TRADE (Match & Lock Escrow) ---
    async initiateTrade(takerId, orderId, requestedAmount, takerPaymentDetails, takerTransactionType) {
        if (!requestedAmount || requestedAmount <= 0) throw new Error("Invalid amount requested");

        return await TransactionHelper.runTransaction(async (session) => {
            const order = await P2POrder.findById(orderId).session(session);
            if (!order) throw new Error("Order not found");
            if (order.status !== 'OPEN') throw new Error("Order is no longer available");
            if (order.userId.toString() === takerId.toString()) throw new Error("Cannot trade with your own order");

            // [MVP SECURITY] Check User P2P Status
            const taker = await User.findById(takerId).session(session);
            if (taker.p2pStatus === 'locked' || taker.p2pStatus === 'banned') {
                throw new Error("Your P2P access is restricted. Please contact support.");
            }

            // [MVP SECURITY] Check Active Trade Limit (Anti-Spam)
            // Limit: 1 Active Trade (CREATED or PAID)
            const activeTradesCount = await P2PTrade.countDocuments({
                $or: [{ buyerId: takerId }, { sellerId: takerId }],
                status: { $in: ['CREATED', 'PAID'] }
            }).session(session);

            if (activeTradesCount >= 1) {
                throw new Error("You have an active trade. Please complete or cancel it before starting a new one.");
            }

            // Identify Roles based on Dual-Market Ad Type
            // SELL Ad = Maker(userId) wants to sell NXS. Taker(takerId) is BUYER.
            // BUY Ad = Maker(userId) wants to buy NXS. Taker(takerId) is SELLER.
            const isSellAd = order.type === 'SELL';
            const sellerId = isSellAd ? order.userId : takerId;
            const buyerId = isSellAd ? takerId : order.userId;

            // Check seller's actual LIVE balance
            const seller = await User.findById(sellerId).session(session);
            if (seller.wallet.main < requestedAmount) {
                if (isSellAd && seller.wallet.main <= 0) {
                    order.status = 'CANCELLED'; // Auto close listing if it was a SELL ad
                    await order.save({ session });
                }
                throw new Error(`Seller only has ${seller.wallet.main} NXS available.`);
            }

            // Check if requested exceeds the order's stated limit
            if (requestedAmount > order.amount) {
                throw new Error(`Maximum limit for this listing is ${order.amount} NXS.`);
            }

            // 1. Lock Seller's Escrow LIVE [SECURITY: Strict Balance Check]
            const updatedSeller = await User.findOneAndUpdate(
                {
                    _id: sellerId,
                    'wallet.main': { $gte: requestedAmount }
                },
                {
                    $inc: {
                        'wallet.main': -requestedAmount,
                        'wallet.escrow_locked': requestedAmount
                    }
                },
                { session, new: true }
            );

            if (!updatedSeller) {
                throw new Error(`Seller does not have enough balance (${requestedAmount} NXS) to fulfill this trade.`);
            }

            // 2. Create Trade Session
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
            const trade = await P2PTrade.create([{
                orderId: order._id,
                sellerId: sellerId,
                buyerId: buyerId,
                amount: requestedAmount,
                takerPaymentDetails: takerPaymentDetails || null, // [NEW] Save Seller's receiving info
                transactionType: takerTransactionType || order.transactionType || 'SEND_MONEY', // [NEW v3.0] Track actual payment paradigm for this specific trade
                status: 'CREATED',
                expiresAt: expiresAt
            }], { session });

            // 3. Log Escrow Transaction
            await Transaction.create([{
                userId: sellerId,
                amount: -requestedAmount,
                type: 'admin_debit',
                description: `P2P Sell Escrow Locked(Trade #${trade[0]._id})`,
                source: 'transaction',
                status: 'completed',
                currency: 'NXS'
            }], { session, ordered: true });

            // We do NOT mark order as LOCKED anymore, because it's a Live Listing that others can still buy from until balance is 0.
            // But we will update the stated max limit
            await P2POrder.findByIdAndUpdate(order._id, {
                $inc: { amount: -requestedAmount }
            }, { session });

            // If order limit hit exactly 0, close it. (Though logic mostly relies on seller.wallet.main now)
            if (order.amount - requestedAmount <= 0) {
                await P2POrder.findByIdAndUpdate(order._id, { status: 'COMPLETED' }, { session });
            }

            return trade[0];
        }).then(async (trade) => {
            const makerId = trade.sellerId.toString() === takerId.toString() ? trade.buyerId : trade.sellerId;
            const notifMsg = trade.sellerId.toString() === makerId.toString() 
                ? `New P2P Match! Buyer is ready to pay for ${trade.amount} NXS`
                : `New P2P Match! Seller accepted your BUY listing for ${trade.amount} NXS`;

            // Notify System & Users out of session
            SocketService.broadcast(`user_${makerId}`, 'p2p_trade_start', trade);
            SocketService.broadcast('admin_dashboard', 'p2p_alert', { type: 'NEW_TRADE', message: `New P2P Trade: ${trade.amount} NXS`, tradeId: trade._id });
            await NotificationService.send(makerId, notifMsg, 'success', { tradeId: trade._id, url: `/p2p?tradeId=${trade._id}` });

            // Because Seller's balance changed, the UserModel pre/post save hook WILL NOT fire from findByIdAndUpdate.
            // So we manually broadcast the new balance to the global market or just personal room.
            const updatedSeller = await User.findById(trade.sellerId);
            SocketService.broadcast(`user_${trade.sellerId}`, `balance_update`, updatedSeller.wallet);

            return trade;
        });
    }

    // Read Methods (Dual-Market & Advanced Filtering)
    async getOpenOrders(currentUserId, filters = {}) {
        let query = { status: 'OPEN' };

        // Filter by Type (BUY / SELL)
        if (filters.type) {
            query.type = filters.type;
        }

        // Filter by Payment Method
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            query.paymentMethod = filters.paymentMethod;
        }

        const orders = await P2POrder.find(query).populate({
            path: 'userId',
            select: 'username badges wallet.main trustScore ratingCount isVerified isVerifiedMerchant completedTrades country role'
        });

        // Current User Country
        let currentUserCountry = "BD"; // Default
        if (currentUserId) {
            const cUser = await User.findById(currentUserId).select('country');
            if (cUser && cUser.country) currentUserCountry = cUser.country.toUpperCase();
        }

        // Apply Country Filtering natively if explicitly requested
        let filteredOrders = orders;

        if (filters.country && filters.country !== 'all') {
            filteredOrders = filteredOrders.filter(o =>
                o.userId && o.userId.country && o.userId.country.toUpperCase() === filters.country.toUpperCase()
            );
        }

        // 1. Filter out stale orders (Sellers must have > 0 balance. Buyers don't need NXS balance)
        // 2. Hide own orders
        filteredOrders = filteredOrders.filter(o => {
            if (!o.userId) return false;
            if (o.userId._id.toString() === currentUserId?.toString()) return false;

            // If it's a SELL ad, maker MUST have NXS balance
            if (o.type === 'SELL') {
                return o.userId.wallet && o.userId.wallet.main > 0;
            }

            // BUY ad relies on BDT outside, so no NXS balance check
            return true;
        });

        // --- DYNAMIC PRIORITY & RANDOMIZATION ---
        const agents = filteredOrders.filter(o => o.userId && o.userId.role === 'agent');
        const others = filteredOrders.filter(o => !o.userId || o.userId.role !== 'agent');

        // Randomized shuffling for agents (Natural appearance)
        const shuffledAgents = agents.sort(() => Math.random() - 0.5);

        // Sorting for other users based on filters
        if (filters.sort === 'lowest') {
            others.sort((a, b) => a.rate - b.rate);
        } else if (filters.sort === 'highest') {
            others.sort((a, b) => b.rate - a.rate);
        } else {
            others.sort((a, b) => b.createdAt - a.createdAt);
        }

        // Combine: Agents first (shuffled), then others (sorted)
        // Native Pagination since we had to filter in memory
        const page = parseInt(filters.page, 10) || 1;
        const limit = parseInt(filters.limit, 10) || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        return filteredOrders.slice(startIndex, endIndex);
    }

    // --- ADMIN: GET ALL LIVE ORDERS ---
    async getAdminOrders(filters = {}) {
        let query = { status: 'OPEN' }; // Only show active ads

        if (filters.type) {
            query.type = filters.type;
        }

        const orders = await P2POrder.find(query).populate({
            path: 'userId',
            select: 'username wallet.main trustScore isVerified isVerifiedMerchant completedTrades country'
        });

        // Sorting Logic
        if (filters.sort) {
            orders.sort((a, b) => {
                if (filters.sort === 'lowest') return a.rate - b.rate;
                if (filters.sort === 'highest') return b.rate - a.rate;
                return new Date(b.createdAt) - new Date(a.createdAt); // default newest
            });
        } else {
            // Default newest first
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return orders;
    }

    // --- ADMIN: FORCE DELETE ORDER & REFUND ESCROW ---
    async adminDeleteOrder(orderId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const order = await P2POrder.findById(orderId).session(session);
            if (!order) throw new Error("Order not found");
            if (order.status !== 'OPEN') throw new Error("Only active OPEN orders can be deleted by admin.");

            // Update Order
            order.status = 'CANCELLED';
            await order.save({ session });

            // Since it's an OPEN order, the seller's initial balance wasn't locked HERE. 
            // In this specific P2P setup, sellers list ads using their MAIN balance directly without upfront locking. 
            // Upfront locking only occurs when a buyer INITIATES a trade (`initiateTrade` -> `wallet.escrow_locked`).
            // So we just need to forcefully cancel the listing. No wallet changes needed for OPEN orders.

            return order;
        });
    }

    // --- 2. CANCEL SELL ORDER (Refunds Escrow) ---
    async cancelOrder(userId, orderId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const order = await P2POrder.findById(orderId).session(session);
            if (!order) throw new Error("Order not found");
            if (order.userId.toString() !== userId.toString()) throw new Error("Unauthorized");
            if (order.status !== 'OPEN') throw new Error("Cannot cancel active/completed order");



            // 2. Update Order
            order.status = 'CANCELLED';
            await order.save({ session });

            // 3. Log
            await Transaction.create([{
                userId,
                amount: order.amount,
                type: 'admin_credit',
                description: `P2P Sell Order Cancelled(Refund)`,
                source: 'transaction', // [HISTORY FIX]
                status: 'completed'
            }], { session, ordered: true });

            return order;
        });
    }



    // --- 2.5 CANCEL TRADE (Reverses Escrow lock if unpaid) ---
    async cancelTrade(userId, tradeId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade) throw new Error("Trade not found");

            if (trade.buyerId.toString() !== userId.toString() && trade.sellerId.toString() !== userId.toString()) {
                throw new Error("Unauthorized to cancel this trade");
            }

            if (trade.status === 'PAID') {
                // [ANTI-FRAUD] User is trying to cancel after marking as PAID
                // Trigger FRAUD_HOLD instead of direct cancellation
                return await this.triggerFraudHold(trade, userId, session);
            }

            if (trade.status !== 'CREATED') {
                throw new Error("Cannot cancel a trade that is already Completed or in Dispute");
            }

            // 1. Release Seller's Escrow back to Main
            await User.findByIdAndUpdate(trade.sellerId, {
                $inc: {
                    'wallet.main': trade.amount,
                    'wallet.escrow_locked': -trade.amount
                }
            }, { session });

            // 2. Log Escrow Return
            await Transaction.create([{
                userId: trade.sellerId,
                amount: trade.amount,
                type: 'admin_credit',
                description: `P2P Escrow Released(Trade #${trade._id} Cancelled)`,
                source: 'transaction',
                status: 'completed',
                currency: 'NXS'
            }], { session, ordered: true });

            // 3. Restore Order Limit so it's visible again
            const order = await P2POrder.findById(trade.orderId).session(session);
            if (order) {
                order.amount += trade.amount;
                if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
                    // It hit 0 earlier/closed, reopen it
                    order.status = 'OPEN';
                }
                await order.save({ session });
            }

            // 4. Mark Trade as Cancelled
            trade.status = 'CANCELLED';
            trade.completedAt = new Date();
            await trade.save({ session });

            return trade;
        }).then(async (trade) => {
            // Notify System & Users out of session
            SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_completed', trade); // 'completed' acts as terminal state to update UI
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_completed', trade);

            const updatedSeller = await User.findById(trade.sellerId);
            SocketService.broadcast(`user_${trade.sellerId}`, `balance_update`, updatedSeller.wallet);

            await this.addSystemMessage(trade._id, `Trade was CANCELLED. Escrow returned to Seller.`);

            return trade;
        });
    }

    // --- 4. BUYER MARKS PAID ---
    async markPaid(userId, tradeId, proofData, ip = 'unknown') {
        const { proofUrl, txId, senderNumber } = proofData;

        // [SECURITY] Either Proof Image OR (TxID + SenderNumber) is required
        if (!proofUrl && (!txId || !senderNumber)) {
            throw new Error("You must upload a Screenshot OR provide TxID + Sender Number");
        }

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");
        // if (trade.buyerId.toString() !== userId.toString()) throw new Error("Unauthorized");
        if (trade.status !== 'CREATED') throw new Error("Invalid Status");

        trade.status = 'PAID';
        trade.paidAt = new Date();
        trade.buyerIp = ip; // [SECURITY] Capture Buyer IP on payment claim

        if (proofUrl) trade.paymentProofUrl = proofUrl;
        if (txId) trade.txId = txId;
        if (senderNumber) trade.senderNumber = senderNumber;

        await trade.save();

        // Notify Seller
        SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_mark_paid', trade);
        await NotificationService.send(trade.sellerId, `Buyer marked trade as PAID. Verify TxID: ${txId || 'N/A'}`, 'info', { tradeId: trade._id, url: `/p2p?tradeId=${trade._id}` });

        await this.addSystemMessage(trade._id, `Buyer marked payment as sent. TxID: ${txId || 'N/A'}, Sender: ${senderNumber || 'N/A'}`);

        return trade;
    }

    // --- 5. SELLER CONFIRMS RELEASE (INSTANT RELEASE WITH PIN) ---
    async confirmRelease(userId, tradeId, pin, ip = 'unknown') {
        if (!pin) throw new Error("Password is required to release funds");

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.sellerId.toString() !== userId.toString()) throw new Error("Unauthorized");
        if (trade.status !== 'PAID') throw new Error("Buyer must mark as paid first");

        // [SECURITY] Verify Account Password instead of separate PIN for ease of use
        const user = await User.findById(userId).select('+password');
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(pin.toString(), user.password);

        if (!isMatch) {
            throw new Error("Invalid Login Password");
        }

        // [CHANGE] "Seamless" Logic: Trust Seller -> Execute Transfer Immediately
        console.log(`[P2P] Seller ${userId} (IP: ${ip}) confirmed receipt with valid PIN. Releasing funds...`);

        // We call adminApproveRelease passing 'SYSTEM_AUTO' as adminId (system action)
        return await this.adminApproveRelease('SYSTEM_AUTO', tradeId, ip);
    }

    // --- 6. ADMIN APPROVES RELEASE (Fee Deduction) ---
    async adminApproveRelease(adminId, tradeId, ip = 'unknown') {
        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade) throw new Error("Trade not found");

            if (adminId === 'SYSTEM_AUTO') {
                trade.sellerIp = ip; // Release triggered by Seller
            } else {
                trade.resolvedByIp = ip; // Release triggered by Admin
            }

            // [FIX] Allow PAID status for Instant Release (System Auto)
            const allowedStatuses = ['AWAITING_ADMIN', 'PAID'];
            if (!allowedStatuses.includes(trade.status)) throw new Error(`Trade status ${trade.status} not valid for release`);

            // --- PSYCHOLOGICAL DYNAMIC FEE SCHEME (VIP TIERS) ---
            const buyerObj = await User.findById(trade.buyerId).session(session);
            const tradesDone = buyerObj.completedTrades || 0;

            let PLATFORM_FEE_PERCENT = 0.01; // Base: 1%
            if (tradesDone >= 500) PLATFORM_FEE_PERCENT = 0.0007; // Whale: 0.07%
            else if (tradesDone >= 250) PLATFORM_FEE_PERCENT = 0.0025; // Expert: 0.25%
            else if (tradesDone >= 100) PLATFORM_FEE_PERCENT = 0.005;  // Pro: 0.50%
            else if (tradesDone >= 20) PLATFORM_FEE_PERCENT = 0.008;   // Trader: 0.80%

            const feeAmount = trade.amount * PLATFORM_FEE_PERCENT;
            const finalAmount = trade.amount - feeAmount;

            // 1. Burn Escrow from Seller & Increment completedTrades
            await User.findByIdAndUpdate(trade.sellerId, {
                $inc: { 'wallet.escrow_locked': -trade.amount, completedTrades: 1 }
            }, { session });

            // 2. Credit Buyer (Net Amount) & Increment completedTrades
            await User.findByIdAndUpdate(trade.buyerId, {
                $inc: { 'wallet.main': finalAmount, completedTrades: 1 }
            }, { session });

            // 3. Ecosystem Money Burn (No Admin Credit)
            // The fee amount simply vanishes from the system, tracking it as Ecosystem Recovery.
            await Transaction.create([{
                userId: trade.sellerId, // Tagged to seller for tracking source
                amount: -feeAmount,
                type: 'fee', // This links exactly to the Ecosystem Tracker
                description: `P2P Trade Burn Fee(2 %)`,
                source: 'system',
                status: 'completed',
                currency: 'NXS'
            }], { session, ordered: true });

            // 4. Close Trade
            trade.status = 'COMPLETED';
            trade.completedAt = new Date();
            trade.fee = feeAmount;
            await trade.save({ session });

            // [FIX] Removed premature order completion here.
            // P2POrder is strictly closed/opened inside `initiateTrade` and `cancelTrade`
            // based on the actual `amount` remaining. Do not auto-close it.

            // 5. Logs - [SECURITY] Made untraceable for users (no sender/receiver ID exposed)
            const isAuto = adminId === 'SYSTEM_AUTO';
            const transactionLogs = [
                {
                    userId: trade.sellerId,
                    relatedUserId: trade.buyerId, // [AUDIT] Track counterparty
                    amount: -trade.amount,
                    type: 'p2p_sell',
                    description: `P2P Settled: ${isAuto ? 'Seller Released' : 'Admin Approved'}`,
                    source: 'transaction',
                    status: 'completed'
                },
                {
                    userId: trade.buyerId,
                    relatedUserId: trade.sellerId, // [AUDIT] Track counterparty
                    amount: finalAmount,
                    type: 'p2p_buy',
                    description: `P2P Settled: ${isAuto ? 'Seller Released' : 'Admin Approved'}`,
                    source: 'transaction',
                    status: 'completed'
                }
            ];

            // Only log admin commission if real admin
            if (adminId && adminId !== 'SYSTEM_AUTO') {
                transactionLogs.push({
                    userId: adminId,
                    amount: feeAmount,
                    type: 'admin_commission',
                    description: `P2P Fee from Trade ${trade._id} `,
                    source: 'income',
                    status: 'completed'
                });
            }

            await Transaction.create(transactionLogs, { session, ordered: true });

            return trade;
        }).then(async (trade) => {
            SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_completed', trade);

            // [FIX] Force Wallet Refresh UI with fresh data
            const buyer = await User.findById(trade.buyerId);
            const seller = await User.findById(trade.sellerId);

            if (buyer) SocketService.broadcast(`user_${trade.buyerId}`, 'balance_update', buyer.wallet);
            if (seller) SocketService.broadcast(`user_${trade.sellerId}`, 'balance_update', seller.wallet);

            this.addSystemMessage(trade._id, `Trade Approved by Admin. Fee: ${trade.fee} NXS deducted.`);
            return trade;
        });
    }

    // --- 6. CHAT SYSTEMS ---
    async sendMessage(tradeId, senderId, text, imageUrl) {
        const msg = await P2PMessage.create({
            tradeId,
            senderId,
            text,
            imageUrl
        });

        // Get Trade to know rooms
        const trade = await P2PTrade.findById(tradeId);

        // Broadcast to both users
        SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_message', msg);
        SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_message', msg);

        // Send Offline Push Notification (Web Push)
        // Determine recipient
        const recipientId = trade.sellerId.toString() === senderId.toString() ? trade.buyerId : trade.sellerId;
        
        // Truncate message text to avoid huge push bodies
        const previewText = text && text.length > 50 ? text.substring(0, 50) + '...' : text;
        const bodyContent = imageUrl ? 'Sent an image attachment' : previewText;
        
        await NotificationService.send(
            recipientId, 
            bodyContent, 
            'chat', 
            { tradeId: trade._id, url: `/p2p?tradeId=${trade._id}`, title: 'New Message' }
        );

        return msg;
    }

    async getMessages(tradeId) {
        return await P2PMessage.find({ tradeId }).sort({ createdAt: 1 });
    }

    async addSystemMessage(tradeId, text) {
        // System Sender ID: We'll use the Buyer ID as a proxy or find an Admin.
        // Better approach: Use the Seller ID so they see it coming from "System" (self) or create a dummy ID.
        // For simplicity and to satisfy schema (required senderId), we'll use the Trade's SellerId but mark type as SYSTEM.

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) return;

        const msg = await P2PMessage.create({
            tradeId,
            senderId: trade.sellerId, // Proxy, but UI will hide/style based on type='SYSTEM'
            text,
            type: 'SYSTEM'
        });

        SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_message', msg);
        SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_message', msg);
    }



    async getMyOrders(userId) {
        return await P2POrder.find({ userId })
            .populate({
                path: 'userId',
                select: 'username badges wallet.main trustScore ratingCount isVerified completedTrades'
            })
            .sort({ createdAt: -1 });
    }

    // [NEW] Get all trades where I am Buyer OR Seller
    async getMyTrades(userId) {
        return await P2PTrade.find({
            $or: [{ sellerId: userId }, { buyerId: userId }]
        })
            .populate('sellerId', 'username')
            .populate('buyerId', 'username')
            .populate('orderId', 'type paymentMethod amount') // Populate order details with type
            .sort({ createdAt: -1 });
    }

    async getAdminTrades() {
        // Fetch all trades that are active or awaiting action
        return await P2PTrade.find({ status: { $in: ['PAID', 'DISPUTE', 'AWAITING_ADMIN'] } })
            .populate('sellerId', 'username')
            .populate('buyerId', 'username')
            .sort({ createdAt: -1 });
    }

    async getTradeDetails(tradeId) {
        return await P2PTrade.findById(tradeId)
            .populate('sellerId', 'username primary_phone')
            .populate('buyerId', 'username')
            .populate('orderId', 'type paymentMethod paymentDetails rate amount transactionType'); // [FIX v3.0] Hydrate parent order transaction mode
    }

    // --- USER INITIATES DISPUTE (TRIBUNAL) ---
    async disputeTrade(userId, tradeId, reason) {
        if (!reason) throw new Error("A reason must be provided to open a dispute.");

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");

        // Only involved parties can open dispute
        if (trade.buyerId.toString() !== userId.toString() && trade.sellerId.toString() !== userId.toString()) {
            throw new Error("Unauthorized: Only participants can report this trade.");
        }

        if (['COMPLETED', 'CANCELLED', 'RESOLVED_BUYER', 'RESOLVED_SELLER'].includes(trade.status)) {
            throw new Error("Cannot dispute a finalized trade");
        }

        trade.status = 'DISPUTE';
        trade.disputeReason = reason;
        trade.disputeRaisedBy = userId;
        trade.disputeAt = new Date();
        await trade.save();

        // Lock the Order as well
        await P2POrder.findByIdAndUpdate(trade.orderId, { status: 'DISPUTE' });

        const reporterRole = trade.sellerId.toString() === userId.toString() ? 'Seller' : 'Buyer';
        this.addSystemMessage(trade._id, `⚠️ Trade put on HOLD.${reporterRole} reported an issue: "${reason}".Admin will review this chat shortly.`);

        // Broadcast
        SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_trade_dispute', trade);
        SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_trade_dispute', trade);
        SocketService.broadcast('admin_dashboard', 'p2p_alert', { type: 'DISPUTE_RAISED', message: `P2P Dispute: Trade #${trade._id} `, tradeId: trade._id });

        return trade;
    }

    // --- 7. ADMIN DISPUTE RESOLUTION ---
    async resolveDispute(adminId, tradeId, resolution, ip = 'unknown') {
        // resolution: 'RELEASE_TO_BUYER' | 'REFUND_TO_SELLER'

        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade) throw new Error("Trade not found");
            if (['COMPLETED', 'CANCELLED'].includes(trade.status)) throw new Error("Trade already finalized");

            trade.resolvedByIp = ip;

            if (resolution === 'RELEASE_TO_BUYER') {
                // Same logic as confirmRelease
                await User.findByIdAndUpdate(trade.sellerId, {
                    $inc: { 'wallet.escrow_locked': -trade.amount }
                }, { session });

                await User.findByIdAndUpdate(trade.buyerId, {
                    $inc: { 'wallet.main': trade.amount }
                }, { session });

                trade.status = 'RESOLVED_BUYER';

            } else if (resolution === 'REFUND_TO_SELLER') {
                // Same logic as cancel
                await User.findByIdAndUpdate(trade.sellerId, {
                    $inc: {
                        'wallet.escrow_locked': -trade.amount,
                        'wallet.main': trade.amount
                    }
                }, { session });

                trade.status = 'RESOLVED_SELLER';
            } else {
                throw new Error("Invalid Resolution Action");
            }

            trade.completedAt = new Date();
            await trade.save({ session });
            await P2POrder.findByIdAndUpdate(trade.orderId, { status: trade.status }, { session });

            // Notify Both
            const msg = `Admin resolved dispute: ${resolution === 'RELEASE_TO_BUYER' ? 'Funds released to Buyer' : 'Funds refunded to Seller'} `;
            SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_completed', trade);
            await NotificationService.send(trade.buyerId, msg, 'info', { url: `/p2p?tradeId=${trade._id}` });
            await NotificationService.send(trade.sellerId, msg, 'info', { url: `/p2p?tradeId=${trade._id}` });

            return trade;
        });
    }
    // --- 8. TRUST RATING SYSTEM ---
    async rateTrade(userId, tradeId, rating) {
        if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.status !== 'COMPLETED') throw new Error("Can only rate completed trades");

        // Determine who is being rated
        // If I am Buyer, I rate Seller. If I am Seller, I rate Buyer.
        let targetUserId;
        if (userId.toString() === trade.buyerId.toString()) {
            if (trade.isRatedByBuyer) throw new Error("You already rated this trade");
            targetUserId = trade.sellerId;
            trade.isRatedByBuyer = true;
        } else if (userId.toString() === trade.sellerId.toString()) {
            if (trade.isRatedBySeller) throw new Error("You already rated this trade");
            targetUserId = trade.buyerId;
            trade.isRatedBySeller = true;
        } else {
            throw new Error("Unauthorized");
        }

        await trade.save();

        // Update Target User Trust Score
        const targetUser = await User.findById(targetUserId);
        const currentScore = targetUser.trustScore || 5.0;
        const currentCount = targetUser.ratingCount || 0;

        // Weighted Average
        const newCount = currentCount + 1;
        const newScore = ((currentScore * currentCount) + rating) / newCount;

        targetUser.trustScore = parseFloat(newScore.toFixed(1));
        targetUser.ratingCount = newCount;
        await targetUser.save();

        return { success: true, newScore: targetUser.trustScore };
    }

    // --- 9. AUTO-CANCEL EXPIRED TRADES (Cron Job) ---
    async autoCancelExpiredTrades() {
        try {
            const expiredTrades = await P2PTrade.find({
                status: 'CREATED',
                expiresAt: { $lt: new Date() }
            });

            if (expiredTrades.length === 0) return 0;

            let cancelledCount = 0;
            // Use Promise.allSettled to prevent one fast failing trade from hanging or slowing the loop
            const cancelPromises = expiredTrades.map(async (trade) => {
                try {
                    await this.cancelTrade(trade.sellerId, trade._id);
                    // P2PMessage creation is not critical enough to fail the cancellation, but we still log it.
                    await P2PMessage.create({ tradeId: trade._id, senderId: trade.sellerId, isSystem: true, content: `⏳ TRADE AUTO - CANCELLED due to inactivity.Escrow returned.` });
                    return true;
                } catch (e) {
                    console.error(`[P2P Auto - Cancel] Failed to cancel trade ${trade._id}: `, e.message);
                    return false;
                }
            });

            const results = await Promise.allSettled(cancelPromises);
            cancelledCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

            if (cancelledCount > 0) {
                console.log(`[P2P Pulse]Auto - cancelled ${cancelledCount} expired trades and released escrow.`);
            }
            return cancelledCount;
        } catch (error) {
            console.error('[P2P Service] Error in autoCancelExpiredTrades:', error);
            return 0;
        }
    }

    // --- MARKET SUMMARY STATS ---
    async getMarketSummary() {
        // 1. Fetch Admin-configured limits for the P2P chart
        let p2pMin = 121;
        let p2pMax = 125;
        try {
            const minSetting = await SystemSetting.findOne({ key: 'p2p_market_min' });
            if (minSetting && minSetting.value) p2pMin = parseFloat(minSetting.value);

            const maxSetting = await SystemSetting.findOne({ key: 'p2p_market_max' });
            if (maxSetting && maxSetting.value) p2pMax = parseFloat(maxSetting.value);
        } catch (e) {
            console.error("Failed to load p2p market limits", e);
        }

        const min = p2pMin || 120;
        const max = p2pMax || 135;

        // 2. Generate 24 data points that fluctuate between min and max
        // Use a seeded approach based on current hour to prevent wild swings on every single page load, creating a smooth animation effect.
        const now = new Date();
        const hourSeed = now.getHours();
        const minuteSeed = now.getMinutes() / 60; // Adds slow variation within the hour

        let chartData = [];
        let currentPrice = min + ((max - min) / 2); // Start in middle

        for (let i = 24; i >= 0; i--) {
            // Pseudo-random walk combining sine and cosine waves for natural-looking peaks/valleys
            const pseudoRand = Math.sin((hourSeed + minuteSeed) + i * 1.5) * Math.cos((hourSeed * 0.5) - i);

            let volatility = (max - min) * 0.15; // Max 15% jump of the total range per interval

            currentPrice += pseudoRand * volatility;

            // Hard Boundary enforcement to guarantee prices NEVER exceed Admin limits
            if (currentPrice > max) currentPrice = max - Math.abs(pseudoRand * volatility);
            if (currentPrice < min) currentPrice = min + Math.abs(pseudoRand * volatility);

            chartData.push({
                time: `${i === 0 ? 'Now' : 24 - i + 'h'} `,
                price: parseFloat(currentPrice.toFixed(2))
            });
        }

        const latestPrice = chartData[chartData.length - 1].price;
        const highestPrice = Math.max(...chartData.map(d => d.price));
        const lowestPrice = Math.min(...chartData.map(d => d.price));

        // Fake Volume that also changes based on the time of day
        const fakeVolume = Math.floor(15000 + (Math.sin(hourSeed) * 5000));

        return {
            price: latestPrice,
            high: highestPrice,
            low: lowestPrice,
            vol: fakeVolume,
            change: 0,
            chartData: chartData,
            minBoundary: min, // Send boundaries back so frontend chart Y-axis scales perfectly
            maxBoundary: max
        };
    }
    // --- [ANTI-FRAUD] Trigger Fraud Hold & Penalty ---
    async triggerFraudHold(trade, userId, session) {
        console.warn(`🚨 [FRAUD ALERT] User ${userId} attempted to cancel PAID trade ${trade._id}`);
        
        // 1. Mark Trade Status
        trade.status = 'FRAUD_HOLD';
        const penaltyPercent = 0.10; // 10% Penalty
        const penaltyAmount = trade.amount * penaltyPercent;
        
        trade.fraudMetadata = {
            penaltyAmount: penaltyAmount,
            isResolved: false,
            adminNotes: `Auto-Hold: Attempted cancellation after PAID status by user ${userId}`
        };
        await trade.save({ session });

        // 2. Lock User's P2P Access
        await User.findByIdAndUpdate(userId, {
            $set: { p2pStatus: 'locked' },
            $inc: { p2pFraudAttempts: 1 }
        }, { session });

        // 3. Deduct Penalty from Escrow (Burn)
        // Note: The rest of the escrow remains locked until Admin resolves it.
        await User.findByIdAndUpdate(trade.sellerId, {
            $inc: { 'wallet.escrow_locked': -penaltyAmount }
        }, { session });

        // 4. Log Penalty Burn
        await Transaction.create([{
            userId: trade.sellerId,
            amount: -penaltyAmount,
            type: 'fee',
            description: `P2P Fraud Penalty (10%) - Trade #${trade._id}`,
            source: 'system',
            status: 'completed'
        }], { session });

        // 5. Notify Admin
        SocketService.broadcast('admin_dashboard', 'p2p_alert', { 
            type: 'FRAUD_DETECTED', 
            message: `FRAUD ATTEMPT: User ${userId} locked. Trade #${trade._id} on HOLD.`, 
            tradeId: trade._id 
        });

        return trade;
    }

    // --- [ADMIN] Resolve Fraud Hold ---
    async resolveFraudHold(adminId, tradeId, action, adminNotes) {
        // action: 'RELEASE_TO_BUYER', 'REFUND_TO_SELLER'
        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade || trade.status !== 'FRAUD_HOLD') throw new Error("Invalid trade status");

            const remainingAmount = trade.amount - trade.fraudMetadata.penaltyAmount;

            if (action === 'RELEASE_TO_BUYER') {
                // Release remaining escrow to buyer
                await User.findByIdAndUpdate(trade.sellerId, {
                    $inc: { 'wallet.escrow_locked': -remainingAmount }
                }, { session });

                await User.findByIdAndUpdate(trade.buyerId, {
                    $inc: { 'wallet.main': remainingAmount }
                }, { session });

                trade.status = 'RESOLVED_BUYER';
            } else if (action === 'REFUND_TO_SELLER') {
                // Refund remaining escrow to seller
                await User.findByIdAndUpdate(trade.sellerId, {
                    $inc: { 
                        'wallet.escrow_locked': -remainingAmount,
                        'wallet.main': remainingAmount
                    }
                }, { session });

                trade.status = 'RESOLVED_SELLER';
            }

            trade.fraudMetadata.isResolved = true;
            trade.fraudMetadata.resolvedBy = adminId;
            trade.fraudMetadata.adminNotes += ` | Resolution: ${action}. Admin Notes: ${adminNotes}`;
            await trade.save({ session });

            return trade;
        });
    }

    // --- [ADMIN] Unlock User P2P ---
    async unlockUserP2P(userId) {
        const user = await User.findByIdAndUpdate(userId, {
            $set: { p2pStatus: 'active' }
        }, { new: true });
        return user;
    }

    // --- Rate User ---
    async rateUser(userId, tradeId, rating) {
        const trade = await mongoose.model('P2PTrade').findById(tradeId);
        if (!trade || trade.status !== 'COMPLETED') throw new Error('Trade not found or not completed.');

        const targetId = userId.toString() === trade.buyerId.toString() ? trade.sellerId : trade.buyerId;
        const user = await User.findById(targetId);
        if (!user) throw new Error('Target user not found.');

        const r = parseFloat(rating);
        if (isNaN(r) || r < 1 || r > 5) throw new Error('Invalid rating (1-5).');

        // Weighted Trust Score Calculation
        const totalRating = (user.trustScore * user.ratingCount) + r;
        user.ratingCount += 1;
        user.trustScore = totalRating / user.ratingCount;

        await user.save();
        return trade;
    }
}

module.exports = new P2PService();
