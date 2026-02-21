const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // --- Identity ---
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },

    // --- SECURITY & STEALTH ---
    // Real Phone (READABLE)
    // --- SECURITY ---
    // Real Phone (Main ID)
    primary_phone: { type: String, required: true, unique: true },

    // Synthetic / Masking Phone (Assigned by Plan)
    synthetic_phone: { type: String, sparse: true },

    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },

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
    country: { type: String, required: true },
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
    transactionPin: { type: String, select: false, default: '123456' }, // Default for migration, user should change

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // --- Wallet ---
    wallet: {
        income: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        purchase: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        main: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // Renamed from main_balance
        game: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        game_locked: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [TURNOVER TRAP] Locked Winnings
        escrow_locked: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [P2P SAFE] Held funds during trade
        agent: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },
        commission: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) }, // [ADMIN/AGENT] Fee Earnings
        pending_referral: { type: Number, default: 0.000000, set: v => parseFloat(v.toFixed(6)) },

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
    isReferralBonusPaid: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 0.00 },
    agentData: {
        due: { type: Number, default: 0.00 },
    },

    // --- Task System ---
    taskData: {
        lastTaskDate: { type: Date },
        tasksCompletedToday: { type: Number, default: 0 },
        accountTier: { type: String, default: 'Starter' },
        currentTask: {
            taskId: String,
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
        }
    },

    // --- Meta ---
    isActive: { type: Boolean, default: true },
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

    // --- P2P Trust (Reputation) ---
    trustScore: { type: Number, default: 5.0 },
    ratingCount: { type: Number, default: 0 },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for frequent lookups
// Index Cleaned
// UserSchema.index({ referralCode: 1 }); // Removed: Conflict with unique: true
UserSchema.index({ synthetic_phone: 1 }); // [NEW] Needed for Session Lookup
UserSchema.index({ referredBy: 1 }); // Optimize Tree Lookup
UserSchema.index({ dailyActivityHours: -1 }); // Optimize Loyalty Leaderboard
UserSchema.index({ status: 1 }); // Admin Filtering
UserSchema.index({ createdAt: -1 }); // Recent Users

module.exports = mongoose.model('User', UserSchema);
