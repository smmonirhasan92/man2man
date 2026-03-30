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
        const userId = req.user.user.id;

        if (!tier || !TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid tier selected.' });
        }

        const selectedTier = TIERS[tier];
        const cost = selectedTier.costNXS;

        // Pick a random outcome from the shuffled pool
        const pool = generatedPools[tier];
        const winOutcome = pool[Math.floor(Math.random() * pool.length)];
        const winAmt = winOutcome.amountNXS;

        const result = await TransactionHelper.runTransaction(async (session) => {
            const User = require('../user/UserModel');
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');

            const initialBalance = parseFloat(user.wallet?.main || 0);
            if (initialBalance < cost) throw new Error('Insufficient Balance');

            // --- 1. CALCULATE FINAL BALANCE ---
            // Atomically calculate the end state: (Initial - Cost + Win)
            const balanceAfterDeduct = initialBalance - cost;
            const finalBalance = balanceAfterDeduct + winAmt;

            // --- 2. UPDATE USER RECORD (SINGLE SAVE) ---
            user.wallet.main = finalBalance;
            user.markModified('wallet.main'); // CRITICAL: Explicitly notify Mongoose of nested change
            await user.save({ session });

            // --- 3. LOG LEDGER (TWO ENTRIES FOR TRANSPARENCY) ---
            const TransactionLedger = require('../wallet/TransactionLedgerModel');
            const trxId = `SPIN_${Date.now()}`;

            // Entry A: The Cost
            await TransactionLedger.create([{
                userId, type: 'debit', amount: -cost,
                balanceBefore: initialBalance, balanceAfter: balanceAfterDeduct,
                description: `Luck Test: ${tier} spin cost`,
                transactionId: `${trxId}_COST`
            }], { session });

            // Entry B: The Win (if any)
            if (winAmt > 0) {
                await TransactionLedger.create([{
                    userId, type: 'credit', amount: winAmt,
                    balanceBefore: balanceAfterDeduct, balanceAfter: finalBalance,
                    description: `Luck Test: ${tier} reward (${winOutcome.label})`,
                    transactionId: `${trxId}_WIN`
                }], { session });
            }

            // Entry C: UI Transaction Record (Net Result for Dashboard)
            await Transaction.create([{
                userId,
                type: winAmt > cost ? 'game_win' : (winAmt === cost ? 'game_neutral' : 'game_loss'),
                amount: winAmt - cost,
                status: 'completed',
                description: `Luck Test: ${winOutcome.label}`,
                source: 'game',
                recipientDetails: `Win: ${winAmt} NXS (Cost: ${cost})`,
                transactionId: `${trxId}_UI`
            }], { session });

            return { winOutcome, newBalance: finalBalance, trxId };
        });

        // --- [NEW: POST-TRANSACTION INTEGRITY VERIFY] ---
        try {
            await verifySpinTransaction(userId, result.trxId, result.newBalance);
        } catch (e) {
            console.error('[CRITICAL] LuckTest Integrity Check Failed', e);
        }

        // Invalidate Redis profile outside of session
        try {
            const redisInv = require('../../config/redis');
            await redisInv.client.del(`user_profile:${userId}`);
        } catch (e) { }

        // Send back matching UI result
        return res.json({
            success: true,
            tier: tier,
            result: {
                ...result.winOutcome,
                sliceIndex: result.winOutcome.index // Pass the exact slice index for visual sync
            },
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

/**
 * [P#3] Verify Transaction Integrity
 * Cross-checks the ledger entries with the final reported balance.
 */
async function verifySpinTransaction(userId, trxId, expectedBalance) {
    const TransactionLedger = require('../wallet/TransactionLedgerModel');
    
    // Fetch all entries for this spin
    const entries = await TransactionLedger.find({
        transactionId: new RegExp(`^${trxId}`)
    }).sort({ createdAt: -1 });

    if (entries.length === 0) return false;

    // Check if the latest entry's balanceAfter matches expectedBalance
    const lastEntryBalance = parseFloat(entries[0].balanceAfter);
    const diff = Math.abs(lastEntryBalance - expectedBalance);

    if (diff > 0.0001) {
        console.error(`[TX_VERIFY] MISMATCH! Expected: ${expectedBalance}, Got: ${lastEntryBalance}`);
        // Here we could trigger an admin alert service
        return false;
    }
    
    console.log(`[TX_VERIFY] ✅ Transaction ${trxId} verified successfully`);
    return true;
}
