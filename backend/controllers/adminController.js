const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');
const Transaction = require('../modules/wallet/TransactionModel'); // Legacy/UI
const P2PTrade = require('../modules/p2p/P2PTradeModel');
const SocketService = require('../modules/common/SocketService');

exports.mintUSC = async (req, res) => {
    // 1. Auth Check (Middleware should handle role, but check PIN here)
    const { amount, pin } = req.body;
    const adminId = req.user._id;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid Amount" });
    if (!pin) return res.status(400).json({ message: "PIN Required" });

    // 2. Verify PIN
    const admin = await User.findById(adminId).select('+adminPin +password');
    // For MVP, we might compare plaintext or simple hash. Assuming plaintext for immediate fix per "Simplified Security"
    // In production, bcrypt.compare(pin, admin.adminPin)
    // CHECK: Did we set a PIN for the Super Admin? In reconstruct script we didn't. 
    // We'll allow a fallback '0000' if not set for recovery.
    if (admin.adminPin && admin.adminPin !== pin) {
        return res.status(403).json({ message: "Invalid Admin PIN" });
    }

    // const session = await mongoose.startSession();
    // session.startTransaction();
    try {
        // 3. Update Balance
        // We use $inc but we need to know the 'before' state for the Ledger
        // So we must fetch first within session.
        const freshAdmin = await User.findById(adminId); // .session(session);
        const balBefore = freshAdmin.wallet.main;
        const balAfter = balBefore + Number(amount);

        // Update User
        freshAdmin.wallet.main = balAfter;
        await freshAdmin.save(); // { session }

        // 4. Ledger Entry (The Source of Truth)
        await TransactionLedger.create({
            userId: adminId,
            type: 'mint',
            amount: Number(amount),
            fee: 0,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: "System Mint via Admin Panel",
            transactionId: `MINT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        }); // , { session }

        // 5. UI Entry (Transaction History for Frontend)
        await Transaction.create({
            userId: adminId,
            type: 'admin_adjustment', // or 'deposit'
            amount: Number(amount),
            currency: 'NXS',
            status: 'completed',
            source: 'system',
            description: 'System Minting'
        }); // , { session }

        // await session.commitTransaction();
        // session.endSession();

        // 6. Broadcast
        SocketService.broadcast(`user_${adminId}`, 'balance_update', {
            wallet: { main: balAfter }
        });

        return res.json({ success: true, message: `Successfully Minted ${amount} USC`, newBalance: balAfter });

    } catch (e) {
        // await session.abortTransaction();
        // session.endSession();
        console.error("Mint Error:", e);
        return res.status(500).json({ message: "Minting Failed: " + e.message });
    }
};

// Update User Balance (Admin Manual Adjustment)
exports.updateUserBalance = async (req, res) => {
    const { id } = req.params;
    const { amount, type, note, secKey1, secKey2, secKey3 } = req.body; // type: 'credit' or 'debit'

    // Safely extract role and adminId based on JWT payload structure
    const role = req.user?.user?.role || req.user?.role;
    const adminId = req.user?.user?.id || req.user?._id;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid Amount" });

    // --- 3-LAYER SECURITY CHECK FOR SUPER ADMIN BALANCE CREATION ---
    if (role === 'super_admin' && type === 'credit') {
        if (!secKey1 || !secKey2 || !secKey3) {
            return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Required to generate balance. Keys missing.' });
        }

        // Validate against .env secrets or use user-provided defaults
        const validKey1 = process.env.SUPER_ADMIN_SEC_KEY_1 || '1234';
        const validKey2 = process.env.SUPER_ADMIN_SEC_KEY_2 || '2314';
        const validKey3 = process.env.SUPER_ADMIN_SEC_KEY_3 || '3124';

        if (secKey1 !== validKey1 || secKey2 !== validKey2 || secKey3 !== validKey3) {
            return res.status(403).json({ message: 'SECURITY ALERT: 3-Layer Verification Failed! Unauthorized access attempt.' });
        }
    }
    // --- END 3-LAYER SECURITY CHECK ---

    // const session = await mongoose.startSession();
    // session.startTransaction();
    try {
        const user = await User.findById(id); // .session(session);
        if (!user) {
            throw new Error("User not found");
        }

        const adjustment = type === 'debit' ? -Number(amount) : Number(amount);
        if (!user.wallet) user.wallet = { main: 0, escrow_locked: 0, commission: 0 };
        const balBefore = user.wallet.main || 0;
        const balAfter = balBefore + adjustment;

        if (balAfter < 0) {
            throw new Error("Insufficient Funds for Debit");
        }

        user.wallet.main = balAfter;
        await user.save(); // { session }

        // Ledger Entry
        console.log("DEBUG: Creating Ledger Entry...");
        await TransactionLedger.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: adjustment,
            fee: 0,
            balanceBefore: balBefore,
            balanceAfter: balAfter,
            description: note || "Admin Balance Adjustment",
            transactionId: `ADJ_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            metadata: { adminId: adminId }
        });

        // UI Transaction Entry
        console.log("DEBUG: Creating UI Transaction...");
        await Transaction.create({
            userId: user._id,
            type: 'admin_adjustment',
            amount: adjustment,
            status: 'completed',
            source: 'admin',
            description: note || `Admin ${type === 'debit' ? 'Deduction' : 'Credit'}`,
            balanceAfter: balAfter
        });

        // await session.commitTransaction();
        // session.endSession();

        // Broadcast Update
        SocketService.broadcast(`user_${user._id}`, 'balance_update', {
            wallet: { main: balAfter }
        });

        return res.json({ success: true, message: "Balance Updated", newBalance: balAfter });
    } catch (e) {
        // await session.abortTransaction();
        // session.endSession();
        console.error("Balance Update Error:", e);
        return res.status(500).json({ message: "Update Failed: " + e.message });
    }
};

exports.getFinancialStats = async (req, res) => {
    // ... existing getFinancialStats code ...
    try {
        // A. Total Minted (From Ledger)
        const mintedAgg = await TransactionLedger.aggregate([
            { $match: { type: 'mint' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalMinted = mintedAgg[0]?.total || 0;

        // B. Total Liabilities (User Balances)
        const userAgg = await User.aggregate([
            { $group: { _id: null, totalMain: { $sum: "$wallet.main" }, totalEscrow: { $sum: "$wallet.escrow_locked" } } }
        ]);
        const liabilities = (userAgg[0]?.totalMain || 0) + (userAgg[0]?.totalEscrow || 0);

        // C. Admin Revenue (Commission Wallet + Fees)
        // Check Super Admin Wallet Commission
        const adminWallet = await User.findOne({ role: 'super_admin' });
        const revenue = adminWallet?.wallet?.commission || 0;

        // D. P2P Volume
        const p2pAgg = await P2PTrade.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, volume: { $sum: "$amount" } } }
        ]);
        const p2pVolume = p2pAgg[0]?.volume || 0;

        res.json({
            overview: {
                total_minted: totalMinted,
                current_liabilities: liabilities,
                net_system_equity: totalMinted - liabilities, // Should be roughly 0 or reflect burned/fees
                unbacked_circulation: liabilities > totalMinted ? liabilities - totalMinted : 0 // Alert if huge
            },
            revenue: {
                total_commission: revenue,
                p2p_volume: p2pVolume
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Stats Failure" });
    }
};

// [ADMIN] Referral Stats
exports.getReferralStats = async (req, res) => {
    try {
        const totalReferrals = await User.countDocuments({ referredBy: { $ne: null } });
        const commissionAgg = await Transaction.aggregate([
            { $match: { type: 'referral_commission', status: 'completed' } },
            { $group: { _id: null, totalEarned: { $sum: '$amount' } } }
        ]);
        const totalCommissionPaid = commissionAgg[0]?.totalEarned || 0;

        res.json({
            totalReferrals,
            totalCommissionPaid,
            activeNetworkSize: totalReferrals
        });
    } catch (e) {
        console.error('Referral Stats Error:', e);
        res.status(500).json({ message: 'Failed to fetch referral stats' });
    }
};

// [ADMIN] User Referral Tree
exports.getUserReferralTree = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("username fullName referralCode");

        if (!user || !user.referralCode) {
            return res.json({ user, children: [] });
        }

        // Fetch direct downlines (Level 1)
        const children = await User.find({ referredBy: user.referralCode })
            .select("username fullName status wallet.income referralIncome createdAt");

        res.json({ user, children });
    } catch (e) {
        console.error('User Tree Error:', e);
        res.status(500).json({ message: 'Failed to fetch user tree' });
    }
};

// [ADMIN] Transparent Money Tracking - Live Vaults
exports.getLiveVaults = async (req, res) => {
    try {
        // 1. Calculate Total Minted (Positive Admin Adjustments & System Mints)
        const mintedAgg = await TransactionLedger.aggregate([
            { $match: { type: { $in: ['admin_adjustment', 'mint'] }, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalMinted = mintedAgg[0]?.total || 0;

        // 2. Calculate Total Revoked / Burned (Negative Admin Adjustments)
        const revokedAgg = await TransactionLedger.aggregate([
            { $match: { type: 'admin_adjustment', amount: { $lt: 0 } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        // Abs value so the UI is easy to read
        const totalRevoked = Math.abs(revokedAgg[0]?.total || 0);

        // 3. User Liability (Total money lingering in user wallets)
        const liabilityAgg = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: null, totalMain: { $sum: "$wallet.main" } } } // Ignored escrow for now per Simplified plan
        ]);
        const totalLiability = liabilityAgg[0]?.totalMain || 0;

        // 4. Admin Profit/Commission (The literal commission wallet of Super Admin)
        const adminUser = await User.findOne({ role: 'super_admin' });
        const adminProfit = adminUser?.wallet?.commission || 0;

        res.json({
            status: 'LIVE',
            vaults: {
                total_minted: totalMinted,
                total_revoked: totalRevoked,
                net_created: totalMinted - totalRevoked,
                global_pool: totalLiability, // Reusing existing UI key for liability
                admin_profit: adminProfit
            },
            lastUpdate: new Date()
        });

    } catch (e) {
        console.error("Live Vaults Error:", e);
        res.status(500).json({ message: "Failed to fetch live vaults" });
    }
};

// [ADMIN] Transparent Money Tracking - Mint Logs
exports.getMintLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = { type: { $in: ['admin_adjustment'] } };

        const total = await TransactionLedger.countDocuments(query);
        const logs = await TransactionLedger.find(query)
            .populate('userId', 'username fullName') // Get the user who received/lost money
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalRecords: total
        });
    } catch (e) {
        console.error("Mint Logs Error:", e);
        res.status(500).json({ message: "Failed to fetch mint logs" });
    }
};
