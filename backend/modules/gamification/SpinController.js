const WalletService = require('../wallet/WalletService');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');

// Mathematical Blueprints (RTP 82-85%, Edge 15-18%)
const TIERS = {
    bronze: {
        cost: 50, // 1 NXS (50 cents USD mathematically in backend? Wait, no. 1 USD = 50 NXS in app? Let me check NXS mapping.)
        // Wait, 1 USD = 50 NXS. 
        // 1 NXS = 2 cents USD ($0.02).
        // Let's use precise NXS amounts for deductions.
        costNXS: 1,
        outcomes: [
            { label: 'Jackpot', amountNXS: 5, chance: 2, cls: 'jackpot' },   // 5 NXS = 10c
            { label: 'Medium', amountNXS: 2, chance: 10, cls: 'medium' },    // 2 NXS = 4c
            { label: 'Refund', amountNXS: 1, chance: 40, cls: 'refund' },    // 1 NXS = 2c
            { label: 'Small', amountNXS: 0.5, chance: 30, cls: 'small' },    // 0.5 NXS = 1c
            { label: 'Miss', amountNXS: 0, chance: 18, cls: 'loss' }
        ]
    },
    silver: {
        costNXS: 2.5, // 5 cents
        outcomes: [
            { label: 'Jackpot', amountNXS: 12.5, chance: 2, cls: 'jackpot' },// 12.5 NXS = 25c
            { label: 'Medium', amountNXS: 5, chance: 15, cls: 'medium' },    // 5 NXS = 10c
            { label: 'Refund', amountNXS: 2.5, chance: 30, cls: 'refund' },  // 2.5 NXS = 5c
            { label: 'Small', amountNXS: 1, chance: 35, cls: 'small' },      // 1 NXS = 2c
            { label: 'Miss', amountNXS: 0, chance: 18, cls: 'loss' }
        ]
    },
    gold: {
        costNXS: 5, // 10 cents
        outcomes: [
            { label: 'Super Jackpot', amountNXS: 25, chance: 1, cls: 'jackpot' }, // 25 NXS = 50c
            { label: 'Medium', amountNXS: 10, chance: 15, cls: 'medium' },   // 10 NXS = 20c
            { label: 'Refund', amountNXS: 5, chance: 30, cls: 'refund' },    // 5 NXS = 10c
            { label: 'Small', amountNXS: 2.5, chance: 40, cls: 'small' },    // 2.5 NXS = 5c
            { label: 'Miss', amountNXS: 0, chance: 14, cls: 'loss' }
        ]
    }
};

// Generate probability pool once
const generatedPools = {};
Object.keys(TIERS).forEach(tierKey => {
    const tier = TIERS[tierKey];
    const pool = [];
    tier.outcomes.forEach((outcome, index) => {
        for (let i = 0; i < outcome.chance; i++) {
            pool.push({ ...outcome, index });
        }
    });
    // Shuffle the array multiple times for secure randomness
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    generatedPools[tierKey] = pool;
});

exports.spinLuckTest = async (req, res) => {
    try {
        const { tier } = req.body;
        const userId = req.user.id;

        if (!tier || !TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const selectedTier = TIERS[tier];
        const cost = selectedTier.costNXS;

        // Pick a random outcome from the shuffled pool
        const pool = generatedPools[tier];
        const randomIndex = Math.floor(Math.random() * pool.length);
        const winOutcome = pool[randomIndex];

        const winAmt = winOutcome.amountNXS;
        const netChange = winAmt - cost;

        const result = await TransactionHelper.runTransaction(async (session) => {
            // 1. Atomic User Balance Update
            const User = require('../user/UserModel');
            const user = await User.findOneAndUpdate(
                { _id: userId, 'wallet.main': { $gte: cost } }, // Ensure they can pay the cost
                { $inc: { 'wallet.main': netChange } },
                { new: true, session }
            );

            if (!user) throw new Error('Insufficient Balance');

            // 2. Log Ledger 
            const TransactionLedger = require('../wallet/TransactionLedgerModel');
            const trxId = `SPIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const balAfter = user.wallet.main || 0;
            const balBefore = balAfter - netChange; // Reverse math to find previous balance

            await TransactionLedger.create([{
                userId,
                type: netChange >= 0 ? 'credit' : 'debit',
                amount: netChange,
                fee: 0,
                balanceBefore: balBefore,
                balanceAfter: balAfter,
                description: `Luck Test: ${tier} result (${winOutcome.label})`,
                transactionId: trxId
            }], { session });

            // 3. Log UI Transaction
            await Transaction.create([{
                userId,
                type: winAmt > 0 ? 'game_win' : 'game_loss',
                amount: netChange, // Show net impact
                status: 'completed',
                description: `Luck Test: ${tier} Spin`,
                source: 'game',
                recipientDetails: winOutcome.label,
                transactionId: trxId + '_UI'
            }], { session });

            return { winOutcome, newBalance: balAfter };
        });

        // Invalidate Redis profile outside of session
        try {
            const redisInv = require('../../config/redis');
            await redisInv.client.del(`user_profile:${userId}`);
        } catch (e) { }

        // Send back matching UI result
        return res.json({
            success: true,
            tier: tier,
            result: winOutcome,
            newBalance: result.newBalance
        });

    } catch (error) {
        if (error.message === 'Insufficient Balance') {
            return res.status(400).json({ success: false, message: 'Insufficient Main Balance (NXS)' });
        }
        console.error('LuckTest Spin Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
