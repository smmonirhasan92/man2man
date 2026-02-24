const mongoose = require('mongoose');
const P2POrder = require('./P2POrderModel');
const P2PTrade = require('./P2PTradeModel');
const P2PMessage = require('./P2PMessageModel');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const SocketService = require('../common/SocketService');
const NotificationService = require('../notification/NotificationService');
const bcrypt = require('bcryptjs');

class P2PService {

    // --- 1. CREATE SELL ORDER (Locks Funds) ---
    async createSellOrder(userId, amount, paymentMethod, paymentDetails) {
        if (amount <= 0) throw new Error("Invalid Amount");

        return await TransactionHelper.runTransaction(async (session) => {
            // 1. Lock Funds
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");
            if (user.wallet.main < amount) throw new Error("Insufficient Main Balance");

            await User.findByIdAndUpdate(userId, {
                $inc: {
                    'wallet.main': -amount,
                    'wallet.escrow_locked': amount
                }
            }, { session });

            // 2. Create Order
            const order = await P2POrder.create([{
                userId,
                amount,
                paymentMethod,
                paymentDetails,
                status: 'OPEN'
            }], { session });

            // 3. Log Escrow Transaction
            await Transaction.create([{
                userId,
                amount: -amount,
                type: 'admin_debit', // Could add 'p2p_escrow_lock' enum later
                description: `P2P Sell Order Locked (Order #${order[0]._id})`,
                source: 'transaction', // [HISTORY FIX]
                status: 'completed',
                currency: 'NXS'
            }], { session });

            return order[0];
        });
    }

    // --- 2. CANCEL SELL ORDER (Refunds Escrow) ---
    async cancelOrder(userId, orderId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const order = await P2POrder.findById(orderId).session(session);
            if (!order) throw new Error("Order not found");
            if (order.userId.toString() !== userId.toString()) throw new Error("Unauthorized");
            if (order.status !== 'OPEN') throw new Error("Cannot cancel active/completed order");

            // 1. Refund Funds
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    'wallet.main': order.amount,
                    'wallet.escrow_locked': -order.amount
                }
            }, { session });

            // 2. Update Order
            order.status = 'CANCELLED';
            await order.save({ session });

            // 3. Log
            await Transaction.create([{
                userId,
                amount: order.amount,
                type: 'admin_credit',
                description: `P2P Sell Order Cancelled (Refund)`,
                source: 'transaction', // [HISTORY FIX]
                status: 'completed'
            }], { session });

            return order;
        });
    }

    // --- 3. INITIATE BUY (Match) ---
    async initiateTrade(buyerId, orderId) {
        // Prevent self-buying
        const order = await P2POrder.findById(orderId);
        if (!order) throw new Error("Order not found");
        if (order.userId.toString() === buyerId.toString()) throw new Error("Cannot buy your own order");
        if (order.status !== 'OPEN') throw new Error("Order is no longer available");

        // Lock Order
        order.status = 'LOCKED';
        await order.save();

        // Create Trade Session
        const trade = await P2PTrade.create({
            orderId: order._id,
            sellerId: order.userId,
            buyerId: buyerId,
            amount: order.amount,
            status: 'CREATED'
        });

        order.activeTradeId = trade._id;
        await order.save();

        // Notify Seller
        SocketService.broadcast(`user_${order.userId}`, 'p2p_trade_start', trade);
        SocketService.broadcast('admin_dashboard', 'p2p_alert', { type: 'NEW_TRADE', message: `New P2P Trade: ${order.amount} NXS`, tradeId: trade._id });
        await NotificationService.send(order.userId, `New P2P Match! Buyer is ready to pay ${order.amount} NXS`, 'success', { tradeId: trade._id });

        return trade;
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
        SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_mark_paid', trade);
        await NotificationService.send(trade.sellerId, `Buyer marked trade as PAID. Verify TxID: ${txId || 'N/A'}`, 'warning', { tradeId: trade._id });

        this.addSystemMessage(trade._id, `Buyer marked payment as sent. TxID: ${txId || 'N/A'}, Sender: ${senderNumber || 'N/A'}`);

        return trade;
    }

    // --- 5. SELLER CONFIRMS RELEASE (INSTANT RELEASE WITH PIN) ---
    async confirmRelease(userId, tradeId, pin) {
        if (!pin) throw new Error("Transaction PIN is required to release funds");

        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");
        if (trade.sellerId.toString() !== userId.toString()) throw new Error("Unauthorized");
        if (trade.status !== 'PAID') throw new Error("Buyer must mark as paid first");

        // [SECURITY] Verify Transaction PIN
        const user = await User.findById(userId).select('+transactionPin');
        if (!user) throw new Error("User not found");

        // Use default 123456 if none is set yet (for backward compatibility during migration)
        const storedPin = user.transactionPin || await bcrypt.hash('123456', 10);

        const isMatch = await bcrypt.compare(pin.toString(), storedPin);
        if (!isMatch) {
            throw new Error("Invalid Transaction PIN");
        }

        // [CHANGE] "Seamless" Logic: Trust Seller -> Execute Transfer Immediately
        console.log(`[P2P] Seller ${userId} confirmed receipt with valid PIN. Releasing funds...`);

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

            const PLATFORM_FEE_PERCENT = 0.02; // 2%
            const feeAmount = trade.amount * PLATFORM_FEE_PERCENT;
            const finalAmount = trade.amount - feeAmount;

            // 1. Burn Escrow from Seller
            await User.findByIdAndUpdate(trade.sellerId, {
                $inc: { 'wallet.escrow_locked': -trade.amount }
            }, { session });

            // 2. Credit Buyer (Net Amount)
            await User.findByIdAndUpdate(trade.buyerId, {
                $inc: { 'wallet.main': finalAmount }
            }, { session });

            // 3. Credit Admin Fee (To Admin Wallet - assuming ID exists or System Wallet)
            // Implementation: We'll log it as a profit transaction for now since we don't have a hardcoded Admin user ID handy in this context without querying.
            // Or if adminId is passed, credit them.
            if (adminId && adminId !== 'SYSTEM_AUTO') {
                await User.findByIdAndUpdate(adminId, {
                    $inc: { 'wallet.commission': feeAmount } // Use commission wallet for fees
                }, { session });
            }

            // 4. Close Trade & Order
            trade.status = 'COMPLETED';
            trade.completedAt = new Date();
            trade.fee = feeAmount;
            await trade.save({ session });

            await P2POrder.findByIdAndUpdate(trade.orderId, { status: 'COMPLETED' }, { session });

            // 5. Logs
            const transactionLogs = [
                {
                    userId: trade.sellerId,
                    amount: -trade.amount,
                    type: 'p2p_sell',
                    description: `P2P Sold to ${trade.buyerId} (Fee: ${feeAmount}) [TxID: ${trade.txId || 'N/A'}]`,
                    source: 'transaction',
                    status: 'completed'
                },
                {
                    userId: trade.buyerId,
                    amount: finalAmount,
                    type: 'p2p_buy',
                    description: `P2P Bought from ${trade.sellerId} (Fee deducted)`,
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
                    description: `P2P Fee from Trade ${trade._id}`,
                    source: 'income',
                    status: 'completed'
                });
            }

            await Transaction.create(transactionLogs, { session });

            return trade;
        }).then(async (trade) => {
            SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_completed', trade);

            // [FIX] Force Wallet Refresh UI
            SocketService.broadcast(`user_${trade.buyerId}`, 'wallet:update', { type: 'p2p_buy', amount: trade.amount });
            SocketService.broadcast(`user_${trade.sellerId}`, 'wallet:update', { type: 'p2p_sell', amount: -trade.amount });

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

    // Read Methods
    async getOpenOrders() {
        return await P2POrder.find({ status: 'OPEN' }).populate('userId', 'username badges');
    }

    async getMyOrders(userId) {
        return await P2POrder.find({ userId }).sort({ createdAt: -1 });
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
            .populate('orderId', 'paymentMethod paymentDetails');
    }

    async holdTrade(tradeId) {
        const trade = await P2PTrade.findById(tradeId);
        if (!trade) throw new Error("Trade not found");
        if (['COMPLETED', 'CANCELLED'].includes(trade.status)) throw new Error("Cannot hold finalized trade");

        trade.status = 'DISPUTE';
        await trade.save();
        await P2POrder.findByIdAndUpdate(trade.orderId, { status: 'DISPUTE' });

        this.addSystemMessage(trade._id, "Trade put on HOLD by System/Admin.");
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
            const msg = `Admin resolved dispute: ${resolution === 'RELEASE_TO_BUYER' ? 'Funds released to Buyer' : 'Funds refunded to Seller'}`;
            SocketService.broadcast(`user_${trade.buyerId}`, 'p2p_completed', trade);
            SocketService.broadcast(`user_${trade.sellerId}`, 'p2p_completed', trade);
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
}

module.exports = new P2PService();
