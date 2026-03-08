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
    async createOrder(userId, amount, paymentMethod, paymentDetails, rate = 126, type = 'SELL', fiatCurrency = 'USD') {
        if (amount <= 0) throw new Error("Invalid Limit Amount");

        // [AUTO-BOUNDARY] Dynamic Rate Limits for Large Transactions
        if (amount >= 50) {
            const standardRate = 126; // System base rate
            const maxVariance = 4; // Maximum allowed difference (+/-)
            const minRate = standardRate - maxVariance;
            const maxRate = standardRate + maxVariance;

            if (rate < minRate || rate > maxRate) {
                throw new Error(`For orders of 50 NXS or more, the exchange rate must be strictly between ${minRate} BDT and ${maxRate} BDT.`);
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

            // Assuming 50 NXS = 1 USD in this ecosystem
            const minWithdrawalNxs = minWithdrawalUsd * 50;

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
            paymentDetails,
            status: 'OPEN'
        });

        return order;
    }

    // --- 3. INITIATE TRADE (Match & Lock Escrow) ---
    async initiateTrade(takerId, orderId, requestedAmount) {
        if (!requestedAmount || requestedAmount <= 0) throw new Error("Invalid amount requested");

        return await TransactionHelper.runTransaction(async (session) => {
            const order = await P2POrder.findById(orderId).session(session);
            if (!order) throw new Error("Order not found");
            if (order.status !== 'OPEN') throw new Error("Order is no longer available");
            if (order.userId.toString() === takerId.toString()) throw new Error("Cannot trade with your own order");

            // [MVP SECURITY] Check Active Trade Limit (Anti-Spam)
            const activeTradesCount = await P2PTrade.countDocuments({
                buyerId: takerId,
                status: 'CREATED'
            }).session(session);

            if (activeTradesCount >= 2) {
                throw new Error("You have too many active unpaid trades. Please complete or cancel them first.");
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

            // 1. Lock Seller's Escrow LIVE
            await User.findByIdAndUpdate(sellerId, {
                $inc: {
                    'wallet.main': -requestedAmount,
                    'wallet.escrow_locked': requestedAmount
                }
            }, { session });

            // 2. Create Trade Session
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
            const trade = await P2PTrade.create([{
                orderId: order._id,
                sellerId: sellerId,
                buyerId: buyerId,
                amount: requestedAmount,
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
            }], { session });

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
            // Notify System & Users out of session
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_trade_start', trade);
            SocketService.broadcast('admin_dashboard', 'p2p_alert', { type: 'NEW_TRADE', message: `New P2P Trade: ${trade.amount} NXS`, tradeId: trade._id });
            await NotificationService.send(trade.sellerId, `New P2P Match! Buyer is ready to pay for ${trade.amount} NXS`, 'success', { tradeId: trade._id });

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
            select: 'username badges wallet.main trustScore ratingCount isVerified isVerifiedMerchant completedTrades country'
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

        // Sorting Logic
        if (filters.sort) {
            // Priority 1: Requested Sorting
            filteredOrders.sort((a, b) => {
                if (filters.sort === 'lowest') return a.rate - b.rate;
                if (filters.sort === 'highest') return b.rate - a.rate;
                return 0;
            });
        } else {
            // Default Sorting: Best Rate First based on Type, then Local Country
            filteredOrders.sort((a, b) => {
                // If it's a SELL ad, buyers want the LOWEST rate
                // If it's a BUY ad, sellers want the HIGHEST rate
                const rateDiff = query.type === 'BUY' ? b.rate - a.rate : a.rate - b.rate;
                if (rateDiff !== 0) return rateDiff;

                // Tie-breaker: Same Country logic
                const aCountry = a.userId.country ? a.userId.country.toUpperCase() : "BD";
                const bCountry = b.userId.country ? b.userId.country.toUpperCase() : "BD";

                if (aCountry === currentUserCountry && bCountry !== currentUserCountry) return -1;
                if (bCountry === currentUserCountry && aCountry !== currentUserCountry) return 1;
                return 0; // Same country logic
            });
        }

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
            }], { session });

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

            if (trade.status !== 'CREATED') {
                throw new Error("Cannot cancel a trade that is already Paid or Completed");
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
            }], { session });

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
            SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_completed', trade); // 'completed' acts as terminal state to update UI
            SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_completed', trade);

            const updatedSeller = await User.findById(trade.sellerId);
            SocketService.broadcast(`user_${trade.sellerId} `, `balance_update`, updatedSeller.wallet);

            await P2PMessage.create({ tradeId: trade._id, senderId: trade.sellerId, isSystem: true, content: `Trade was CANCELLED.Escrow returned to Seller.` });

            return trade;
        });
    }

    // --- 4. BUYER MARKS PAID ---
    // --- 4. BUYER MARKS PAID ---
    async markPaid(userId, tradeId, proofData) {
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

        if (proofUrl) trade.paymentProofUrl = proofUrl;
        if (txId) trade.txId = txId;
        if (senderNumber) trade.senderNumber = senderNumber;

        await trade.save();

        // Notify Seller
        SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_mark_paid', trade);
        await NotificationService.send(trade.sellerId, `Buyer marked trade as PAID.Verify TxID: ${txId || 'N/A'} `, 'warning', { tradeId: trade._id });

        await P2PMessage.create({ tradeId: trade._id, senderId: trade.buyerId, isSystem: true, content: `Buyer marked payment as sent.TxID: ${txId || 'N/A'}, Sender: ${senderNumber || 'N/A'} ` });

        return trade;
    }

    // --- 5. SELLER CONFIRMS RELEASE (INSTANT RELEASE WITH PIN) ---
    async confirmRelease(userId, tradeId, pin) {
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
        console.log(`[P2P] Seller ${userId} confirmed receipt with valid PIN.Releasing funds...`);

        // We call adminApproveRelease passing 'SYSTEM_AUTO' as adminId (system action)
        return await this.adminApproveRelease('SYSTEM_AUTO', tradeId);
    }

    // --- 6. ADMIN APPROVES RELEASE (Fee Deduction) ---
    async adminApproveRelease(adminId, tradeId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade) throw new Error("Trade not found");

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
            }], { session });

            // 4. Close Trade
            trade.status = 'COMPLETED';
            trade.completedAt = new Date();
            trade.fee = feeAmount;
            await trade.save({ session });

            // [FIX] Removed premature order completion here.
            // P2POrder is strictly closed/opened inside `initiateTrade` and `cancelTrade`
            // based on the actual `amount` remaining. Do not auto-close it.

            // 5. Logs - [SECURITY] Made untraceable for users (no sender/receiver ID exposed)
            const transactionLogs = [
                {
                    userId: trade.sellerId,
                    amount: -trade.amount,
                    type: 'p2p_sell',
                    description: `P2P Trade Settled`, // Generic description 
                    source: 'transaction',
                    status: 'completed'
                },
                {
                    userId: trade.buyerId,
                    amount: finalAmount,
                    type: 'p2p_buy',
                    description: `P2P Escrow Release`, // Generic description
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

            await Transaction.create(transactionLogs, { session });

            return trade;
        }).then(async (trade) => {
            SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_completed', trade);

            // [FIX] Force Wallet Refresh UI
            SocketService.broadcast(`user_${trade.buyerId} `, 'wallet:update', { type: 'p2p_buy', amount: trade.amount });
            SocketService.broadcast(`user_${trade.sellerId} `, 'wallet:update', { type: 'p2p_sell', amount: -trade.amount });

            this.addSystemMessage(trade._id, `Trade Approved by Admin.Fee: ${trade.fee} NXS deducted.`);
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
        SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_message', msg);
        SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_message', msg);

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

        SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_message', msg);
        SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_message', msg);
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
            .populate('orderId', 'paymentMethod amount') // Populate order details
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
            .populate('orderId', 'paymentMethod paymentDetails rate amount');
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
        SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_trade_dispute', trade);
        SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_trade_dispute', trade);
        SocketService.broadcast('admin_dashboard', 'p2p_alert', { type: 'DISPUTE_RAISED', message: `P2P Dispute: Trade #${trade._id} `, tradeId: trade._id });

        return trade;
    }

    // --- 7. ADMIN DISPUTE RESOLUTION ---
    async resolveDispute(adminId, tradeId, resolution) {
        // resolution: 'RELEASE_TO_BUYER' | 'REFUND_TO_SELLER'

        return await TransactionHelper.runTransaction(async (session) => {
            const trade = await P2PTrade.findById(tradeId).session(session);
            if (!trade) throw new Error("Trade not found");
            if (['COMPLETED', 'CANCELLED'].includes(trade.status)) throw new Error("Trade already finalized");

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
            SocketService.broadcast(`user_${trade.buyerId} `, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId} `, 'p2p_completed', trade);
            await NotificationService.send(trade.buyerId, msg, 'info');
            await NotificationService.send(trade.sellerId, msg, 'info');

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
        let p2pMin = 120;
        let p2pMax = 135;
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
}

module.exports = new P2PService();
