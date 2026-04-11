const TransactionHelper = require('../common/TransactionHelper');
const UniversalMatchMaker = require('./UniversalMatchMaker');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');

const GIFT_TIERS = {
    free: { cost: 0, mult: 1.0 }, // Free is special
    bronze: { cost: 3 },
    silver: { cost: 6 },
    gold: { cost: 9 }
};

exports.openGiftBox = async (req, res) => {
    try {
        const { tier = 'bronze' } = req.body;
        const userId = req.user.user.id;

        if (!GIFT_TIERS[tier]) return res.status(400).json({ success: false, message: 'Invalid tier.' });

        const selectedTier = GIFT_TIERS[tier];
        const cost = selectedTier.cost;
        const windowMs = 500; // Fast-batch window

        // [RETENTION] Fetch streak so engine can force refund after 4+ losses
        const userDoc = await User.findById(userId).select('gameStats.consecutiveLosses').lean();
        const consecutiveLosses = userDoc?.gameStats?.consecutiveLosses || 0;

        // Process through Pure Pooling Engine
        const matchResult = await UniversalMatchMaker.processMatch(userId, cost, 'gift', tier, windowMs, consecutiveLosses);
        let winAmt = matchResult.winAmount;

        // Fetch and deduct Free Box directly from User-Interest Fund to keep Admin protected
        if (cost === 0) {
            const GameVault = require('./GameVaultModel');
            const vault = await GameVault.getMasterVault();
            winAmt = parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)); // Reduced free tier payload to 0.1-0.6
            
            if (vault.balances.userInterest >= winAmt) {
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, { $inc: { 'balances.userInterest': -winAmt }});
            } else {
               winAmt = 0; // Vault is empty, Free Box gives nothing!
            }
        }

        const resultData = await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (user.wallet.main < cost) throw new Error('Insufficient Balance');

            const initialBalance = user.wallet.main;
            const finalBalance = initialBalance - cost + winAmt;

            // [SECURITY] SANITY CHECK
            const isSafe = await TransactionHelper.checkBalanceSafety(initialBalance, finalBalance);
            if (!isSafe) throw new Error('Security Alert: Excessive Balance Change Blocked.');

            user.wallet.main = finalBalance;

            // --- AUDIT LOGGING (Bet & Win) ---
            const betTxId = `GIFT_BET_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            
            // 1. Log Bet (only if cost > 0)
            if (cost > 0) {
                await Transaction.create([{
                    userId,
                    type: 'game_bet',
                    amount: -cost,
                    currency: 'NXS',
                    status: 'completed',
                    source: 'game',
                    description: `Opened ${tier} Mystery Gift`,
                    transactionId: betTxId,
                    balanceAfter: initialBalance - cost
                }], { session });

                await TransactionLedger.create([{
                    userId,
                    type: 'game_bet',
                    amount: -cost,
                    balanceBefore: initialBalance,
                    balanceAfter: initialBalance - cost,
                    description: `Mystery Gift Bet (${tier})`,
                    transactionId: betTxId
                }], { session });
            }

            // 2. Log Win (if any)
            if (winAmt > 0) {
                const winTxId = `GIFT_WIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                const isFree = cost === 0;

                await Transaction.create([{
                    userId,
                    type: 'game_win',
                    amount: winAmt,
                    currency: 'NXS',
                    status: 'completed',
                    source: 'game',
                    description: `Mystery Gift: ${matchResult.label || (isFree ? 'Free Reward' : 'Prize')}`,
                    transactionId: winTxId,
                    balanceAfter: finalBalance
                }], { session });

                await TransactionLedger.create([{
                    userId,
                    type: 'game_win',
                    amount: winAmt,
                    balanceBefore: isFree ? initialBalance : initialBalance - cost,
                    balanceAfter: finalBalance,
                    description: isFree ? `Free Mystery Gift Reward` : `Mystery Gift Prize (${tier})`,
                    transactionId: winTxId
                }], { session });
            }

            // Stats Update
            user.gameStats.totalGamesPlayed += 1;
            user.gameStats.netProfitLoss += (winAmt - cost);
            if (matchResult.isWin) user.gameStats.totalGamesWon += 1; else user.gameStats.consecutiveLosses += 1;

            user.markModified('wallet.main');
            user.markModified('gameStats');
            await user.save({ session });

            return { winAmt, finalBalance: user.wallet.main };
        });

        // Match Frontend expectation
        return res.json({
            success: true,
            tier,
            reward: {
                label: matchResult.label || (matchResult.isWin ? 'Super Win' : 'Consolation'),
                amountNXS: winAmt,
                isWin: matchResult.isWin
            },
            newBalance: resultData.finalBalance
        });

    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
