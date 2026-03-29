const WalletService = require('../wallet/WalletService');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');
const User = require('../user/UserModel');

// --- GIFT BOX TIERS & REWARDS ---
const GIFT_TIERS = {
    free: {
        costNXS: 0,
        isDaily: true,
        outcomes: [
            { label: 'Small Box', amountNXS: 0.05, chance: 60, cls: 'small' },
            { label: 'Medium Box', amountNXS: 0.15, chance: 30, cls: 'medium' },
            { label: 'Big Box', amountNXS: 0.50, chance: 9, cls: 'big' },
            { label: 'Mega Box', amountNXS: 1.00, chance: 1, cls: 'mega' }
        ]
    },
    bronze: {
        costNXS: 1,
        outcomes: [
            { label: 'Common', amountNXS: 0.50, chance: 35, cls: 'small' },
            { label: 'Refund', amountNXS: 1.00, chance: 30, cls: 'refund' },
            { label: 'Medium', amountNXS: 2.00, chance: 25, cls: 'medium' },
            { label: 'Jackpot', amountNXS: 5.00, chance: 10, cls: 'jackpot' }
        ]
    },
    silver: {
        costNXS: 5,
        outcomes: [
            { label: 'Common', amountNXS: 2.50, chance: 30, cls: 'small' },
            { label: 'Refund', amountNXS: 5.00, chance: 35, cls: 'refund' },
            { label: 'Rare', amountNXS: 12.50, chance: 25, cls: 'medium' },
            { label: 'Mega Win', amountNXS: 25.00, chance: 10, cls: 'jackpot' }
        ]
    },
    gold: {
        costNXS: 10,
        outcomes: [
            { label: 'Return', amountNXS: 5.00, chance: 25, cls: 'small' },
            { label: 'Refund', amountNXS: 10.00, chance: 35, cls: 'refund' },
            { label: 'Epic', amountNXS: 30.00, chance: 30, cls: 'medium' },
            { label: 'Super Win', amountNXS: 100.00, chance: 10, cls: 'jackpot' }
        ]
    }
};

// Generate probability pool (Optimized memory usage)
const pools = {};
Object.keys(GIFT_TIERS).forEach(tierKey => {
    const pool = [];
    GIFT_TIERS[tierKey].outcomes.forEach((outcome, idx) => {
        for (let i = 0; i < outcome.chance; i++) pool.push({ ...outcome, idx });
    });
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pools[tierKey] = pool;
});

exports.openGiftBox = async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user.user.id;

        if (!tier || !GIFT_TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid gift box tier.' });
        }

        const selectedTier = GIFT_TIERS[tier];
        const cost = selectedTier.costNXS;

        // Perform Transactional Update
        const result = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            // --- 0. DAILY LIMIT CHECK (Only for Free Box) ---
            if (selectedTier.isDaily) {
                const now = new Date();
                const lastDate = user.taskData?.dailyGiftDate;
                
                if (lastDate) {
                    const diffMs = now - new Date(lastDate);
                    const diffHrs = diffMs / (1000 * 60 * 60);
                    if (diffHrs < 24) {
                        const remaining = Math.ceil(24 - diffHrs);
                        throw new Error(`Daily Free Gift already opened. Try again in ${remaining} hours.`);
                    }
                }
                // Update timestamp for Free Gift
                if (!user.taskData) user.taskData = {};
                user.taskData.dailyGiftDate = now;
            }

            // --- 1. BALANCE CHECK (Paid Boxes) ---
            const currentMain = parseFloat(user.wallet?.main || 0);
            if (cost > 0 && currentMain < cost) {
                throw new Error('Insufficient NXS balance to open this box.');
            }

            // --- 2. PICK OUTCOME ---
            const pool = pools[tier];
            const randomIndex = Math.floor(Math.random() * pool.length);
            const winOutcome = pool[randomIndex];
            const winAmt = winOutcome.amountNXS;

            // --- 3. APPLY BALANCE CHANGES ---
            const netChange = winAmt - cost;
            if (!user.wallet) user.wallet = {};
            user.wallet.main = parseFloat((parseFloat(user.wallet.main || 0) + netChange).toFixed(6));

            await user.save({ session });

            // --- 4. LOG TRANSACTIONS ---
            const trxId = `GIFT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            
            // UI Record
            await Transaction.create([{
                userId,
                type: winAmt > cost ? 'game_win' : 'game_loss',
                amount: netChange,
                status: 'completed',
                description: `Mystery Gift: ${tier} opened`,
                source: 'game',
                recipientDetails: winOutcome.label,
                transactionId: trxId
            }], { session });

            return { winOutcome, newBalance: user.wallet.main };
        });

        // Invalidate Cache
        try {
            const redis = require('../../config/redis');
            await redis.client.del(`user_profile:${userId}`);
        } catch (e) { }

        return res.json({
            success: true,
            reward: result.winOutcome,
            newBalance: result.newBalance
        });

    } catch (error) {
        console.error('[GIFT_BOX] Open Error:', error.message);
        res.status(400).json({ success: false, message: error.message || 'Failed to open gift box' });
    }
};
