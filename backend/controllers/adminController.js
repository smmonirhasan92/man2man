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

        const fixedAmount = parseFloat(parseFloat(amount).toFixed(4));
        const adjustment = type === 'debit' ? -fixedAmount : fixedAmount;
        if (!user.wallet) user.wallet = { main: 0, escrow_locked: 0, commission: 0 };
        const balBefore = user.wallet.main || 0;
        const balAfter = parseFloat((balBefore + adjustment).toFixed(4));

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
    try {
        const todayStart = new Date();

        // A. Total Minted (From Ledger)
        const mintedAgg = await TransactionLedger.aggregate([
            { $match: { type: 'mint' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalMinted = mintedAgg[0]?.total || 0;

        // [AGENT REQ] Total Minted Today
        const mintedTodayAgg = await TransactionLedger.aggregate([
            { $match: { type: { $in: ['admin_adjustment', 'mint'] }, amount: { $gt: 0 }, createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const mintedToday = mintedTodayAgg[0]?.total || 0;

        // B. Total Liabilities (User Balances)
        const userAgg = await User.aggregate([
            { $group: { _id: null, totalMain: { $sum: "$wallet.main" }, totalEscrow: { $sum: "$wallet.escrow_locked" } } }
        ]);
        const liabilities = (userAgg[0]?.totalMain || 0) + (userAgg[0]?.totalEscrow || 0);

        // C. Admin Revenue (Commission Wallet + Fees)
        const adminWallet = await User.findOne({ role: 'super_admin' });
        const revenue = adminWallet?.wallet?.commission || 0;

        // D. P2P Volume
        const p2pAgg = await P2PTrade.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, volume: { $sum: "$amount" } } }
        ]);
        const p2pVolume = p2pAgg[0]?.volume || 0;

        // [AGENT REQ] P2P Volume Today
        const p2pTodayAgg = await P2PTrade.aggregate([
            { $match: { status: 'COMPLETED', createdAt: { $gte: todayStart } } },
            { $group: { _id: null, volume: { $sum: "$amount" } } }
        ]);
        const p2pVolumeToday = p2pTodayAgg[0]?.volume || 0;

        // ==========================================
        // NEW AGGREGATIONS FOR SYSTEM ECONOMICS
        // ==========================================

        // E. Total System Deposits
        const depositAgg = await Transaction.aggregate([
            { $match: { type: { $in: ['deposit', 'add_money', 'recharge'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalDeposits = depositAgg[0]?.total || 0;

        // [AGENT REQ] Cash-In Today
        const depositsTodayAgg = await Transaction.aggregate([
            { $match: { type: { $in: ['deposit', 'add_money', 'recharge'] }, status: 'completed', createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const depositsToday = depositsTodayAgg[0]?.total || 0;

        // F. Total System Withdrawals
        const withdrawAgg = await Transaction.aggregate([
            { $match: { type: { $in: ['withdraw', 'cash_out'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalWithdraws = withdrawAgg[0]?.total || 0;

        // G. Total Server Purchase Revenue (Recovery)
        const serverSalesAgg = await Transaction.aggregate([
            { $match: { type: 'plan_purchase', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalServerRevenue = serverSalesAgg[0]?.total || 0;

        // [AGENT REQ] Package Sales Today
        const serverSalesTodayAgg = await Transaction.aggregate([
            { $match: { type: 'plan_purchase', status: 'completed', createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const serverSalesToday = serverSalesTodayAgg[0]?.total || 0;

        // H. Total Task Income Given (Liability Generated)
        const taskIncomeAgg = await Transaction.aggregate([
            { $match: { type: 'task_reward', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalTaskIncome = taskIncomeAgg[0]?.total || 0;

        // I. Total Lottery Sales Revenue (Recovery)
        const lotteryBuyAgg = await Transaction.aggregate([
            { $match: { type: 'lottery_buy', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalLotteryRevenue = lotteryBuyAgg[0]?.total || 0;

        // J. Total Lottery Prizes Given (Liability Generated)
        const lotteryWinAgg = await Transaction.aggregate([
            { $match: { type: 'lottery_win', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalLotteryPrizes = lotteryWinAgg[0]?.total || 0;

        // K. Total Referral Bonus Given (Liability Generated)
        const refBonusAgg = await Transaction.aggregate([
            { $match: { type: 'referral_commission', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalReferralBonus = refBonusAgg[0]?.total || 0;

        // L. Total P2P Fees Collected (Recovery)
        const p2pFeeAgg = await Transaction.aggregate([
            { $match: { type: 'fee', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalP2PFee = p2pFeeAgg[0]?.total || 0;

        // M. Total Users
        const totalUsers = await User.countDocuments();

        // Calculated Super Totals
        const totalSystemRecovery = totalServerRevenue + totalLotteryRevenue + totalP2PFee;
        const totalIncomeGiven = totalTaskIncome + totalLotteryPrizes + totalReferralBonus;
        const netSystemProfit = totalSystemRecovery - totalIncomeGiven;

        const totalRevoked = 0; // Placeholder - burn mechanic not yet implemented

        const healthStatus = liabilities > totalMinted * 1.5 ? 'CRITICAL' : liabilities > totalMinted ? 'WARNING' : 'HEALTHY';

        res.json({
            overview: {
                total_minted: totalMinted,
                current_liabilities: liabilities,
                net_system_equity: totalMinted - liabilities,
                unbacked_circulation: liabilities > totalMinted ? liabilities - totalMinted : 0,
                today_deposits: totalDeposits,
                today_withdraws: totalWithdraws,
                pending_deposits: 0,
                pending_withdraws: 0
            },
            authorized: {
                total_deposits: totalDeposits,
                net_game_creation: totalTaskIncome + totalReferralBonus + totalLotteryPrizes,
                total_supply: totalDeposits + totalTaskIncome + totalReferralBonus + totalLotteryPrizes
            },
            actual: {
                user_main_balances: userAgg[0]?.totalMain || 0,
                user_game_balances: userAgg[0]?.totalEscrow || 0,
                total_liability: liabilities
            },
            volume: {
                p2p_transfers: p2pVolume
            },
            health: {
                status: healthStatus,
                message: healthStatus === 'HEALTHY'
                    ? 'System funds are well-backed. Recovery exceeds liability.'
                    : healthStatus === 'WARNING'
                        ? 'Liabilities are approaching minted supply. Monitor closely.'
                        : 'CRITICAL: Liabilities exceed minted supply by a large margin.',
                discrepancy: liabilities - totalMinted
            },
            agent_live_stats: {
                minted_today: mintedToday,
                cash_in_today: depositsToday,
                p2p_volume_today: p2pVolumeToday,
                package_sales_today: serverSalesToday
            },
            revenue: {
                total_commission: revenue,
                p2p_volume: p2pVolume
            },
            economics: {
                totalUsers,
                totalDeposits,
                totalWithdraws,
                totalServerRevenue,
                totalTaskIncome,
                totalLotteryRevenue,
                totalLotteryPrizes,
                totalReferralBonus,
                totalP2PFee,
                totalSystemRecovery,
                totalIncomeGiven,
                netSystemProfit
            }
        });
    } catch (e) {
        console.error("Stats Failure:", e);
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

// [ADMIN] Ecosystem Balance Sheet (Liability vs Recovery)
exports.getEconomyBalanceSheet = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // 1. Group daily transactions to see what is generated vs burned
        const dailyStats = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: 'completed',
                    type: { $in: ['task_reward', 'referral_commission', 'lottery_buy', 'plan_purchase', 'fee'] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    taskMined: {
                        $sum: { $cond: [{ $eq: ["$type", "task_reward"] }, "$amount", 0] }
                    },
                    referralMined: {
                        $sum: { $cond: [{ $eq: ["$type", "referral_commission"] }, "$amount", 0] }
                    },
                    lotteryBurned: {
                        $sum: { $cond: [{ $eq: ["$type", "lottery_buy"] }, { $abs: "$amount" }, 0] }
                    },
                    planBurned: {
                        $sum: { $cond: [{ $eq: ["$type", "plan_purchase"] }, { $abs: "$amount" }, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Format the data for the frontend chart
        let todayGen = 0;
        let todayBurn = 0;

        const formattedStats = dailyStats.map(stat => {
            const totalGen = stat.taskMined + stat.referralMined;
            const totalBurn = stat.lotteryBurned + stat.planBurned;

            // Check if this is "today" comparing the YYYY-MM-DD string
            const todayStr = new Date().toISOString().split('T')[0];
            if (stat._id === todayStr) {
                todayGen = totalGen;
                todayBurn = totalBurn;
            }

            return {
                date: stat._id,
                generated: totalGen,
                tasks: stat.taskMined,
                referrals: stat.referralMined,
                burned: totalBurn,
                lottery_recovery: stat.lotteryBurned,
                plan_recovery: stat.planBurned,
                net_drain: totalGen - totalBurn
            };
        });

        res.json({
            today_generation: todayGen,
            today_recovery: todayBurn,
            today_net: todayGen - todayBurn,
            chart_data: formattedStats
        });

    } catch (e) {
        console.error("Economy Stats Error:", e);
        res.status(500).json({ message: "Failed to fetch economy stats" });
    }
};

// [ADMIN] Get Full User Profile Details
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('+ipAddress +lastLogin +deviceId +lastIp +status +loyaltyScore +promotionalStatus')
            .populate('referredBy', 'fullName primary_phone')
            .lean();

        if (!user) return res.status(404).json({ message: "User not found" });

        // [CURRENCY FIX] Define USD vs NXS Buckets
        // USD: Real money flow (Deposits, Mobile Recharge, Admin Adjustments in USD)
        // NXS: Ecosystem tokens (Task Rewards, Commissions, Plan Purchases, Withdrawals)
        // Ratio: 1 USD = 50 NXS
        const NXS_RATIO = 50;

        const usd_deposits = await Transaction.aggregate([
            { $match: { userId: user._id, type: { $in: ['deposit', 'add_money', 'recharge', 'admin_credit'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const nxs_withdrawals = await Transaction.aggregate([
            { $match: { userId: user._id, type: { $in: ['withdraw', 'cash_out', 'admin_debit'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const nxs_earnings = await Transaction.aggregate([
            { $match: { userId: user._id, type: { $in: ['task_reward', 'referral_commission', 'referral_bonus', 'lottery_win', 'game_win'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const nxs_spent = await Transaction.aggregate([
            { $match: { userId: user._id, type: { $in: ['plan_purchase', 'lottery_buy', 'game_bet', 'fee'] }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const nxs_p2pIn = await Transaction.aggregate([
            { $match: { userId: user._id, type: 'p2p_receive', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const nxs_p2pOut = await Transaction.aggregate([
            { $match: { userId: user._id, type: 'p2p_send', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);

        const totalUsdIn = usd_deposits[0]?.total || 0;
        const totalNxsOut = (nxs_withdrawals[0]?.total || 0) + (nxs_spent[0]?.total || 0) + (nxs_p2pOut[0]?.total || 0);
        const totalNxsIn = (nxs_earnings[0]?.total || 0) + (nxs_p2pIn[0]?.total || 0);

        // Normalize everything to USD for "Platform Position"
        const normalizedNxsIn = totalNxsIn / NXS_RATIO;
        const normalizedNxsOut = totalNxsOut / NXS_RATIO;

        user.financials = {
            totalDeposited: totalUsdIn,
            totalWithdrawn: nxs_withdrawals[0]?.total || 0,
            totalEarned: nxs_earnings[0]?.total || 0,
            totalSpent: nxs_spent[0]?.total || 0,
            totalP2PReceived: nxs_p2pIn[0]?.total || 0,
            totalP2PSent: nxs_p2pOut[0]?.total || 0,
            p2pNet: (nxs_p2pIn[0]?.total || 0) - (nxs_p2pOut[0]?.total || 0),
            currencyRatio: NXS_RATIO,
            // (Real USD In) + (NXS Income in USD) - (NXS Outgo in USD)
            netAccounting: totalUsdIn + normalizedNxsIn - normalizedNxsOut
        };

        // [NEW] Fetch Plan Purchase History
        user.planHistory = await Transaction.find({
            userId: user._id,
            type: 'plan_purchase',
            status: 'completed'
        })
            .select('amount createdAt adminNote')
            .sort({ createdAt: -1 })
            .lean();

        // UI Mapping Fixes
        user.phone = user.primary_phone; // UI expects user.phone
        user.referrals = { count: user.referralCount || 0 }; // UI expects profile.referrals.count

        // [AGENT REQ] Debt vs Recovery Audit
        const initialDebtAgg = await TransactionLedger.aggregate([
            { $match: { userId: user._id, type: { $in: ['admin_adjustment', 'mint', 'admin_credit'] }, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const initialDebt = initialDebtAgg[0]?.total || 0;

        const p2pSalesAgg = await Transaction.aggregate([
            { $match: { userId: user._id, type: 'p2p_sell', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const p2pSales = p2pSalesAgg[0]?.total || 0;

        user.agentAudit = {
            initialDebt,
            p2pSales,
            netLiability: parseFloat((initialDebt - p2pSales).toFixed(4)),
            debtLimit: user.agentData?.debtLimit || 0
        };

        res.json(user);
    } catch (err) {
        console.error("Get User Details Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// [ADMIN] Change User Access Status (Freeze/Block)
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'restricted', 'blocked'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ message: `User status updated to ${status}`, user });
    } catch (err) {
        console.error("Update User Status Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
// [ADMIN] Hard Delete User with Financial Reconciliation
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) return res.status(404).json({ message: "User not found" });

        // [FINANCIAL RECONCILIATION]
        // Deduct their balances from the system's "Total Supply" before deletion
        const balToBurn = user.wallet.main || 0;
        const escrowToBurn = user.wallet.escrow_locked || 0;
        const totalToBurn = balToBurn + escrowToBurn;

        if (totalToBurn > 0) {
            await TransactionLedger.create({
                userId: user._id,
                type: 'admin_adjustment', // Acts as a burn record
                amount: -totalToBurn,
                fee: 0,
                balanceBefore: totalToBurn,
                balanceAfter: 0,
                description: `SYSTEM_RECONCILIATION: User ${user.username} deleted. Balance Burned.`,
                transactionId: `BURN_${Date.now()}_${user._id.toString().substr(-4)}`,
                metadata: { reason: 'user_deletion', originalBalance: totalToBurn }
            });
        }

        // Hard Delete User
        await User.findByIdAndDelete(id);

        res.json({ success: true, message: `User ${user.username} deleted and ${totalToBurn} NSX deducted from total supply.` });
    } catch (e) {
        console.error("Delete User Error:", e);
        res.status(500).json({ message: "Deletion Failed" });
    }
};
