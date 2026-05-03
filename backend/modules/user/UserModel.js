const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // --- Identity ---
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },

    // --- SECURITY & STEALTH ---
    // Real Phone (READABLE)
    // --- SECURITY ---
    // Real Phone (Main ID) - Made optional for new Email-based USA System
    primary_phone: { type: String, unique: true, sparse: true },

    // Synthetic / Masking Phone (Assigned by Plan)
    synthetic_phone: { type: String, sparse: true },

    email: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false }, // [NEW] True after OTP verification
    password: { type: String, required: true },

    // --- EMPIRE RACE: Financial & Gamification Tracking ---
    purchaseCount: { type: Number, default: 0 }, // 0 = New User
    monthlyPurchases: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
    tourSales: { type: Number, default: 0 }, // Tracks "Big Packages" sold by directs

    role: {
        type: String,
        enum: ['super_admin', 'admin', 'sub_admin', 'agent', 'user'],
        default: 'user'
    },
    group: {
        type: String,
        default: 'Standard'
    },

    // --- Profile ---
    country: { type: String, default: 'Global' },
    photoUrl: { type: String },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

    // --- KYC ---
    kycStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },

    // [SECURITY] Admin Transaction PIN
    adminPin: { type: String, select: false }, // Hashed like password

    // [SECURITY] User Transaction PIN (P2P/Withdrawal)
    transactionPin: { type: String, select: false, default: null }, // Removed '123456' default for P#4 security polish

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // --- Wallet ---
    wallet: {
        income: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        purchase: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        main: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // Renamed from main_balance
        // Game wallets removed per "No Games" policy constraint
        escrow_locked: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [P2P SAFE] Held funds during trade
        loan_due: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [SMART LOAN] Tracks unpaid loans

        agent: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        commission: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [ADMIN/AGENT] Fee Earnings
        pending_referral: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        staked: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [STAKING] Locked NXS
        total_earned_staking: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [STAKING] Lifetime earnings
        rechargeEscrow: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [BINANCE-STYLE] Locked during agent recharge

        turnover: {
            required: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
            completed: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }
        }
    },

    // --- Agent System (Stealth Rotation) ---
    referralCode: { type: String, unique: true, sparse: true },
    referralSecurity: {
        currentId: { type: String },
        expiresAt: { type: Date },
        history: [{ type: String }]
    },
    referredBy: { type: String },
    referralCount: { type: Number, default: 0 },
    referralIncome: { type: Number, default: 0.00 },
    referralEarningsByLevel: {
        type: [Number],
        default: [0, 0, 0, 0, 0] // Level 1 to 5
    },
    referralHands: { type: Number, default: 0 }, // Traditional 5-ref hands
    handMilestonesClaimed: { type: [Number], default: [] },
    
    // [EMPIRE TRACKING]
    tourSales: { type: Number, default: 0 }, // Counts "Big" package purchases by directs
    purchaseCount: { type: Number, default: 0 }, // Counts total package purchases by directs
    monthlyPurchases: { type: Number, default: 0 },
    lastPurchaseDate: { type: Date },
    
    // [EMPIRE HAND - 5x5]
    empireHands: [{
        handIndex: { type: Number, default: 1 },
        directs: [{ 
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            downlineCount: { type: Number, default: 0 }, // Must hit 5
            isQualified: { type: Boolean, default: false }
        }],
        status: { type: String, enum: ['active', 'matured', 'claimed'], default: 'active' },
        maturityDate: { type: Date },
        bonusAmount: { type: Number, default: 0 }
    }],
    
    isReferralBonusPaid: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 0.00 },
    agentData: {
        due: { type: Number, default: 0.00 },
        debtLimit: { type: Number, default: 5000 }, // Default limit for new agents
        isActiveForRecharge: { type: Boolean, default: true }, // [BINANCE-STYLE] Toggle availability
    },

    // --- Task System ---
    taskData: {
        lastTaskDate: { type: Date },
        tasksCompletedToday: { type: Number, default: 0 },
        accountTier: { type: String, default: 'Starter' },
        currentTask: {
            taskId: { type: String },
            startTime: Date
        },
        // Promotion & Target Tracking
        targetStats: {
            targetUserCount: { type: Number, default: 10 }, // Admin sets this
            achievedUserCount: { type: Number, default: 0 },
            isTargetMet: { type: Boolean, default: false }
        },
        promotionalStatus: {
            type: String,
            enum: ['eligible', 'promoted', 'none'],
            default: 'none'
        },
        dailySpinDate: { type: Date }, // [NEW] Track the last time they spun the bonus wheel
        dailyGiftDate: { type: Date } // [NEW] Track the last time they opened a Mystery Gift Box
    },

    // --- Meta ---
    isActive: { type: Boolean, default: true },
    is_loan_active: { type: Boolean, default: false }, // [SMART LOAN] Active flag

    pushSubscriptions: [{
        endpoint: String,
        expirationTime: Date,
        keys: {
            p256dh: String,
            auth: String
        }
    }],
    status: {
        type: String,
        enum: ['active', 'restricted', 'blocked'],
        default: 'active'
    },

    // Visitor Tracking
    ipAddress: { type: String },
    lastLogin: { type: Date },

    deviceId: { type: String, select: false }, // Security: FingerprintJS ID
    lastIp: { type: String, select: false },   // Security: IP Address
    isDeviceWhitelisted: { type: Boolean, default: false }, // Multi-account bypass

    // Retention / Loyalty
    dailyActivityHours: { type: Number, default: 0 }, // Tracked by "Pulse" or heartbeat
    loyaltyScore: { type: Number, default: 0 },

    // --- P2P Trust & Anti-Fraud ---
    trustScore: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },
    isVerifiedMerchant: { type: Boolean, default: false }, // [NEW] Admin assigned verification badge
    p2pStatus: { 
        type: String, 
        enum: ['active', 'locked', 'banned'], 
        default: 'active' 
    },
    p2pFraudAttempts: { type: Number, default: 0 },

    // --- Universal Engine Statistics ---
    gameStats: {
        totalGamesPlayed: { type: Number, default: 0 },
        totalGamesWon: { type: Number, default: 0 }, // Rank 1 or 2
        consecutiveLosses: { type: Number, default: 0 },
        netProfitLoss: { type: Number, default: 0 }, // Positive = User won more than spent
        lastWinDate: { type: Date }
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// [PHASE 3: LIVE SYNC] Automatic Wallet Sync via Socket
UserSchema.post('save', function (doc) {
    // We broadcast the new wallet balance to the user's personal room instantly.
    // Using setImmediate to unblock the main Node event loop for High-Hype environments (1000+ users)
    setImmediate(() => {
        try {
            const SocketService = require('../common/SocketService');
            if (SocketService.getIO()) {
                SocketService.broadcast(`user_${doc._id}`, `balance_update_${doc._id}`, doc.wallet.main); // Legacy compatibility
                SocketService.broadcast(`user_${doc._id}`, `balance_update`, doc.wallet); // Standard new format
            }
        } catch (e) {
            console.error("[LIVE SYNC] Failed to broadcast wallet update", e);
        }
    });
});

// Indexes for frequent lookups
// NOTE: primary_phone, email, username, referralCode uniqueness is handled
// via the field-level unique:true + sparse:true declarations above.
// DO NOT add duplicate schema.index() calls for those fields.
UserSchema.index({ referredBy: 1 });          // Optimize Tree Lookup
UserSchema.index({ dailyActivityHours: -1 }); // Optimize Loyalty Leaderboard
UserSchema.index({ status: 1 });              // Admin Filtering
UserSchema.index({ createdAt: -1 });          // Recent Users

const UserModel = mongoose.model('User', UserSchema);

// [SELF-HEALING] On first load, ensure all unique indexes are sparse.
// This prevents E11000 duplicate key on null values when phone is not provided.
UserModel.on('index', (err) => {
    if (err) console.error('[UserModel] Index build error:', err.message);
});

setTimeout(async () => {
    try {
        const col = UserModel.collection;
        const indexes = await col.indexes();
        const sparseTargets = ['primary_phone_1', 'email_1', 'username_1', 'referralCode_1', 'synthetic_phone_1'];
        for (const idx of indexes) {
            if (sparseTargets.includes(idx.name) && idx.unique && !idx.sparse) {
                console.warn(`[UserModel] ⚠️  Non-sparse unique index detected: ${idx.name} — dropping and rebuilding as sparse.`);
                await col.dropIndex(idx.name).catch(() => {});
            }
        }
    } catch(e) {
        // Non-critical — log but don't crash server
        console.warn('[UserModel] Index self-heal check failed:', e.message);
    }
}, 3000); // Run 3s after startup once DB is connected

module.exports = UserModel;
