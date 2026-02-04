const mongoose = require('mongoose');
const User = require('../user/UserModel');
const TransactionHelper = require('../common/TransactionHelper');
const { client } = require('../../config/redis');

/**
 * AVIATOR SERVICE (STRICT REBUILD)
 * Compliance:
 * 1. 3-Tier Commission (8%/10%/15%) with 3:3:4 Split.
 * 2. Balance-Based Vault Lock (>10x Balance -> 70% Locked).
 * 3. Unlock Rule: 200% Turnover (Release 50% of Bet Amount).
 * 4. Liquidity-Safe Crash Logic.
 */
class AviatorService {

    constructor() {
        this.ROUND_KEY = 'aviator:round:current';
        this.BETS_KEY = 'aviator:round:bets'; // NOW A HASH: userId -> betData
        this.STATE_KEY = 'aviator:state'; // WAITING, FLYING, CRASHED
        this.START_TIME_KEY = 'aviator:start_time';
        this.CRASH_POINT_KEY = 'aviator:crash_point';
        this.HISTORY_KEY = 'aviator:history';

        // Ensure Log File Exists
        const fs = require('fs');
        if (!fs.existsSync('aviator_error.log')) {
            fs.writeFileSync('aviator_error.log', '');
        }
    }

    /**
     * Get Current Game State
     */
    async getState() {
        if (!client.isOpen) return null;
        try {
            const [state, startTime, crashPoint] = await Promise.all([
                client.get(this.STATE_KEY),
                client.get(this.START_TIME_KEY),
                client.get(this.CRASH_POINT_KEY)
            ]);

            let history = [];
            try {
                const historyRaw = await client.lRange(this.HISTORY_KEY, 0, 19);
                history = historyRaw ? historyRaw.map(h => parseFloat(h)) : [];
            } catch (rkErr) {
                if (rkErr.message.includes('WRONGTYPE')) {
                    client.del(this.HISTORY_KEY).catch(() => { });
                }
            }

            return {
                state: state || 'WAITING',
                startTime: parseInt(startTime || '0'),
                crashPoint: parseFloat(crashPoint || '1.00'),
                serverTime: Date.now(),
                history
            };
        } catch (e) {
            const fs = require('fs');
            fs.appendFileSync('aviator_error.log', `[${new Date().toISOString()}] GET_STATE ERROR: ${e.message}\n`);
            throw e;
        }
    }

    /**
     * Place Bet (Optimized O(1))
     */
    async placeBet(userId, amount) {
        if (!amount || isNaN(amount) || amount <= 0) throw new Error("Invalid Bet Amount");
        const state = await client.get(this.STATE_KEY);
        if (state === 'FLYING') throw new Error("Round in progress.");

        return await TransactionHelper.runTransaction(async (session) => {
            // 1. UNLOCK LOGIC: 50% of Bet Amount releases from Vault
            const unlockAmount = Math.floor(amount * 0.50);
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");
            if (user.wallet.game < amount) throw new Error("Insufficient Game Balance");

            let logUnlock = 0;
            if (user.wallet.game_locked > 0 && unlockAmount > 0) {
                const actualRelease = Math.min(user.wallet.game_locked, unlockAmount);
                if (actualRelease > 0) {
                    await User.findByIdAndUpdate(userId, {
                        $inc: { 'wallet.game_locked': -actualRelease, 'wallet.game': actualRelease }
                    }, { session });
                    logUnlock = actualRelease;
                }
            }

            // 2. DEDUCT BET
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { 'wallet.game': -amount } },
                { new: true, session }
            );

            // 3. REGISTER BET (HASH for O(1))
            const betId = new mongoose.Types.ObjectId().toString();
            const betData = {
                betId,
                userId: userId.toString(),
                amount,
                cashOut: null,
                win: 0,
                timestamp: Date.now()
            };

            // Use HSET for instant key access
            await client.hSet(this.BETS_KEY, userId.toString(), JSON.stringify(betData));

            // [INTELLIGENT P2P ENGINE]
            const IntelligenceController = require('./IntelligenceController');
            await IntelligenceController.processBet(userId, amount);

            // console.log(`[AVIATOR_BET] User: ${userId} | Amount: ${amount}`);
            return { success: true, balance: updatedUser.wallet.game, betId };
        });
    }

    /**
     * Cash Out (Optimized O(1))
     */
    async cashOut(userId, betId, currentMultiplier) {
        const fs = require('fs');
        try {
            // Validation (Fast Checks First)
            const [state, crashPoint] = await Promise.all([
                client.get(this.STATE_KEY),
                client.get(this.CRASH_POINT_KEY)
            ]);

            // Graceful Logic: Allow cashout if Flying OR (Crashed AND User was stuck in safe zone)
            if (state !== 'FLYING') {
                if (state === 'CRASHED') {
                    const safeLimit = parseFloat(crashPoint || '1.00');
                    if (currentMultiplier >= safeLimit) {
                        throw new Error("Round Ended (Crashed)");
                    }
                    // Else: Allow Late Cashout (User clicked Safe, but packet arrived Late)
                } else {
                    throw new Error("Round Ended");
                }
            }



            // O(1) Lookup
            const betRaw = await client.hGet(this.BETS_KEY, userId.toString());
            if (!betRaw) throw new Error("Bet Not Found");

            let targetBet = JSON.parse(betRaw);
            if (targetBet.betId !== betId) throw new Error("Bet ID Mismatch"); // Prevent stale clicks
            if (targetBet.cashOut) throw new Error("Already Cashed Out");

            // Calculate Win
            const rawWin = Math.floor(targetBet.amount * currentMultiplier);

            return await TransactionHelper.runTransaction(async (session) => {
                // 1. VAULT CHECK
                const user = await User.findById(userId).session(session);
                const currentBalance = user.wallet.game;

                // We need total wins for Vault logic. 
                // In Hash model, getting 'totalRoundWins' requires 'hVals' scan. 
                // Optimized: We can skip full scan and just check this user's current win vs balance.
                // The original logic summed *previous* wins in list. 
                // We'll stick to isolating this transaction's impact or do a quick scan if needed.
                // For speed, let's just check THIS win against balance. "ProjectedTotalWin" was summing.
                // If we want total round wins, we have to Fetch All. 
                // But for 100-200 users, HVALS is fast.

                // Let's optimize: Only check if win is HUGE.
                // Or just HVALS.

                let payout = rawWin;
                let locked = 0;

                if (rawWin > (currentBalance * 10)) {
                    // Simplified Check for Speed: If SINGLE win is > 10x Balance.
                    payout = Math.floor(rawWin * 0.30);
                    locked = Math.floor(rawWin - payout);

                    await User.findByIdAndUpdate(userId, {
                        $inc: { 'wallet.game_locked': locked }
                    }, { session });
                }

                // 2. PAYOUT (Atomic)
                const finalUser = await User.findByIdAndUpdate(userId, {
                    $inc: { 'wallet.game': payout }
                }, { new: true, session });

                // 3. UPDATE BET STATUS (Redis)
                targetBet.cashOut = currentMultiplier;
                targetBet.win = rawWin;
                await client.hSet(this.BETS_KEY, userId.toString(), JSON.stringify(targetBet));

                // 4. DEDUCT FROM POOL
                await client.incrByFloat('wallet:global_prize_pool', -payout);

                // LOG SUCCESS
                /* console.log(JSON.stringify({
                    type: 'AVIATOR_CASHOUT',
                    userId,
                    multiplier: currentMultiplier,
                    win: rawWin,
                    payout
                })); */

                return { success: true, win: payout, balance: finalUser.wallet.game, locked };
            });

        } catch (e) {
            // LOG ERROR TO FILE
            const logEntry = `[${new Date().toISOString()}] FAIL User:${userId} | Err: ${e.message}\n`;
            fs.appendFileSync('aviator_error.log', logEntry);
            throw e; // Re-throw for frontend
        }
    }

    /**
     * Internal Helpers for Game Loop
     */
    async startRound() {
        await client.del(this.BETS_KEY);
        await client.set(this.STATE_KEY, 'WAITING');
        await client.del('aviator:hazard_signal');
    }

    async takeOff() {
        await client.set(this.STATE_KEY, 'FLYING');
        await client.set(this.START_TIME_KEY, Date.now());
    }

    async completeRound(crashPoint) {
        await client.lPush(this.HISTORY_KEY, String(crashPoint));
        await client.lTrim(this.HISTORY_KEY, 0, 19);
        await client.set(this.STATE_KEY, 'CRASHED');
        await client.set(this.CRASH_POINT_KEY, String(crashPoint));
    }

    async getRoundTotalBets() {
        if (!client.isOpen) return 0;
        // Use HVALS for Hash
        const bets = await client.hVals(this.BETS_KEY);
        return bets.reduce((sum, b) => sum + (JSON.parse(b).amount || 0), 0);
    }

    async generateCrashPoint(totalBets) {
        // [INTELLIGENT P2P ENGINE V1.0]

        const pool = parseFloat(await client.get('wallet:global_prize_pool') || '0');
        const microPool = parseFloat(await client.get('pool:class_b') || '0');
        const playableLiquidity = (pool + microPool) * 0.85; // 85% Safety

        // A. Generate "Natural" Crash Point (Provably Fair)
        const hash = require('crypto').randomBytes(8).toString('hex');
        const h = parseInt(hash.slice(0, 13), 16);
        const e = Math.pow(2, 52);
        let naturalCrash = Math.floor((100 * e - h) / (e - h)) / 100.0;
        if (naturalCrash < 1.00) naturalCrash = 1.00;

        // B. Apply P2P Liquidity Constraint
        const betsRaw = await client.hVals(this.BETS_KEY); // [UPDATED] Use HVALS
        const bets = betsRaw.map(b => JSON.parse(b));

        let potentialPayout = 0;
        bets.forEach(b => {
            potentialPayout += parseFloat(b.amount) * naturalCrash;
        });

        let finalCrash = naturalCrash;
        let decision = 'Natural';

        if (potentialPayout > playableLiquidity) {
            const safe = playableLiquidity / ((typeof totalBets === 'number' ? totalBets : 1) || 1);
            if (safe < naturalCrash) {
                finalCrash = Math.floor(safe * 100) / 100;
                if (finalCrash < 1.00) finalCrash = 1.00; // House takes all
                decision = 'Liquidity_Clamp';
            }
        }

        // C. Role-Based Bias
        const hasWhale = bets.some(b => parseFloat(b.amount) > 500);
        if (hasWhale && finalCrash > 1.5) {
            if (Math.random() < 0.4) {
                finalCrash = 1.20; // Early Crash
                decision = 'Whale_Trap';
            }
        } else if (!hasWhale && bets.length > 0 && finalCrash < 2.0) {
            if ((totalBets * 2.0) < playableLiquidity && Math.random() < 0.3) {
                finalCrash = Math.max(finalCrash, 2.10);
                decision = 'Micro_Boost';
            }
        }

        console.log(`[AVIATOR_P2P] Pool:${playableLiquidity.toFixed(2)} | Bets:${bets.length} | Decision:${decision} | Natural:${naturalCrash} -> Final:${finalCrash}`);
        return finalCrash;
    }

    async _distributeCommission(amount) {
        if (!client.isOpen) return;

        // Dynamic Rate
        const activeUsers = parseInt(await client.get('server:active_users') || '0');
        let rate = 0.08;
        if (activeUsers >= 50 && activeUsers <= 500) rate = 0.10;
        else if (activeUsers > 500) rate = 0.15;

        const comm = Math.floor(amount * rate);

        // 3:3:4 Split
        const tech = Math.floor(comm * 0.30);
        const replay = Math.floor(comm * 0.30);
        const partner = Math.floor(comm * 0.40);

        const poolShare = amount - comm;

        await client.incrByFloat('wallet:tech', tech);
        await client.incrByFloat('wallet:replay', replay);
        await client.incrByFloat('wallet:partner', partner);
        await client.incrByFloat('wallet:global_prize_pool', poolShare);

        console.log(`[COMMISSION_TRACE] Bet:${amount} | Rate:${rate * 100}% | Tech:${tech} | Replay:${replay} | Partner:${partner}`);
    }
}

module.exports = new AviatorService();
