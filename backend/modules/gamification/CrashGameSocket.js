const { generateSecureCrashPoint } = require('./CrashGameEngine');
const GameVault = require('./GameVaultModel');
const CrashGameRound = require('./CrashGameRoundModel');
const TransactionHelper = require('../common/TransactionHelper');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionLedger = require('../wallet/TransactionLedgerModel');

class CrashGameManager {
    constructor() {
        this.io = null;
        this.state = 'BETTING'; // BETTING -> FLYING -> CRASHED
        this.currentMultiplier = 1.00;
        this.crashPoint = 1.00;
        this.roundId = null;
        this.bets = new Map(); // userId => { amount, cashedOut: false, payout: 0 }
        
        // Timing settings
        this.BETTING_PHASE_MS = 10000; // 10 seconds to bet
        this.END_PHASE_MS = 5000;      // 5 seconds crash screen
        this.startTime = 0;
        
        this.tickInterval = null;
    }

    init(io) {
        this.io = io;
        this.startBettingPhase();
    }

    // --- PHASE 1: BETTING ---
    async startBettingPhase() {
        this.state = 'BETTING';
        this.bets.clear();
        this.currentMultiplier = 1.00;
        this.roundId = `CRASH-ROUND-${Date.now()}`;
        
        // Broadcast state
        this.io.emit('crash_state_change', {
            state: this.state,
            roundId: this.roundId,
            timeLeft: this.BETTING_PHASE_MS
        });

        // Countdown timer
        setTimeout(() => this.startFlyingPhase(), this.BETTING_PHASE_MS);
    }

    // --- PHASE 2: FLYING ---
    async startFlyingPhase() {
        this.state = 'PREPARING';
        this.io.emit('crash_state_change', { state: 'PREPARING' });

        try {
            // 1. Lock in the bets and calculate the Crash Point!
            let totalBets = 0;
            this.bets.forEach(bet => totalBets += bet.amount);

            let poolLiquidity = 0;
            let adminCommission = 0;

            // Using ACID Transaction to deduct wallet funds and fund the pool
            await TransactionHelper.runTransaction(async (session) => {
                const vault = await GameVault.getMasterVault();
                const HOUSE_EDGE_PCT = vault.config.houseEdge / 100; // Default 10%

                // Deduct house edge from total bets
                adminCommission = parseFloat((totalBets * HOUSE_EDGE_PCT).toFixed(6));
                const poolContribution = totalBets - adminCommission;

                // Update vault balances atomically
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.adminIncome': adminCommission,
                        'balances.activePool': poolContribution,
                        'stats.totalBetsIn': totalBets,
                        'stats.totalGamesPlayed': this.bets.size
                    }
                });

                const updatedVault = await GameVault.getMasterVault();
                poolLiquidity = updatedVault.balances.activePool;

                // Create the Historical Round Entry
                await CrashGameRound.create([{
                    roundIdentifier: this.roundId,
                    finalMultiplier: 0, // Update later
                    totalBetsIn: totalBets,
                    adminCommissionCut: adminCommission,
                    playersActive: this.bets.size,
                    status: 'flying',
                    startTime: new Date()
                }], { session, ordered: true });
            });

            // 2. Algorithm Generation!
            this.crashPoint = generateSecureCrashPoint(poolLiquidity, totalBets);
            
            console.log(`[🏎️ CRASH STARTED] Pool: ${poolLiquidity.toFixed(2)}, Bets: ${totalBets.toFixed(2)}, Secret Crash Array: @${this.crashPoint}x`);

            // 3. Begin Emitting Fly Ticks
            this.state = 'FLYING';
            this.startTime = Date.now();
            this.io.emit('crash_state_change', { state: this.state, roundId: this.roundId });

            this.tickInterval = setInterval(() => this.tick(), 50); // 50ms pulse

        } catch (err) {
            console.error("[CRASH START ERROR]", err);
            this.startBettingPhase(); // Fallback to restart
        }
    }

    // --- GAME ENGINE TICK (Exponential Curve) ---
    tick() {
        if (this.state !== 'FLYING') return;

        const timeElapsedMs = Date.now() - this.startTime;
        
        // This is the true aviator curve formula: Math.pow(e, rt)
        // Adjust the 0.00005 factor to make it fly faster/slower
        let calculatedMultiplier = Math.pow(Math.E, 0.00006 * timeElapsedMs);

        if (calculatedMultiplier >= this.crashPoint) {
            // BOOM!
            calculatedMultiplier = this.crashPoint;
            this.currentMultiplier = calculatedMultiplier;
            this.executeCrash();
            return;
        }

        this.currentMultiplier = parseFloat(calculatedMultiplier.toFixed(2));
        
        // Broadcast to clients
        this.io.emit('crash_tick', { multiplier: this.currentMultiplier });
    }

    // --- PHASE 3: CRASHED ---
    async executeCrash() {
        clearInterval(this.tickInterval);
        this.state = 'CRASHED';
        this.io.emit('crash_final', { multiplier: this.crashPoint });

        let totalPayouts = 0;
        let cOuts = 0;
        this.bets.forEach(bet => {
            if (bet.cashedOut) {
                totalPayouts += bet.payout;
                cOuts++;
            }
        });

        // Record the end state to DB via Async task
        TransactionHelper.runTransaction(async (session) => {
            // Deduct payouts from active pool
            if (totalPayouts > 0) {
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.activePool': -totalPayouts,
                        'stats.totalPayoutsOut': totalPayouts
                    }
                });
            }

            await CrashGameRound.findOneAndUpdate(
                { roundIdentifier: this.roundId },
                { 
                    status: 'crashed', 
                    finalMultiplier: this.crashPoint,
                    totalPayoutsOut: totalPayouts,
                    playersCashedOut: cOuts,
                    crashTime: new Date()
                },
                { session }
            );

        }).catch(err => console.error("Failed to commit final crash round state", err));

        setTimeout(() => this.startBettingPhase(), this.END_PHASE_MS);
    }

    // --- USER ACTIONS ---
    async placeBet(userId, amount) {
        if (this.state !== 'BETTING') throw new Error('Betting phase is closed');
        if (amount < 1) throw new Error('Minimum bet is 1 NXS');
        if (this.bets.has(userId)) throw new Error('You already placed a bet this round');

        // Check and deduct immediately (Mongoose validation needed in strict model, but handled by ACID here)
        await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User not found');
            const mainBal = parseFloat(user.wallet?.main || 0);

            if (mainBal < amount) throw new Error('Insufficient Main Wallet Balance');

            user.wallet.main = parseFloat((mainBal - amount).toFixed(6));
            user.markModified('wallet.main');
            await user.save({ session });

            const trxId = `CRASH_BET_${this.roundId}_${userId}`;
            await TransactionLedger.create([{
                userId, type: 'debit', amount: -amount,
                balanceBefore: mainBal, balanceAfter: user.wallet.main,
                description: `Crash Entry: ${amount} NXS`,
                transactionId: trxId
            }], { session, ordered: true });
            
            // Note: Dashboard UI Transaction not needed for BET, only for NET result at the end of round
        });

        this.bets.set(userId, { amount, cashedOut: false, payout: 0 });
        return { success: true, newBalance: this.currentMultiplier /* Return state info if needed */ };
    }

    async cashOut(userId) {
        if (this.state !== 'FLYING') throw new Error('Game is not flying');
        
        const betData = this.bets.get(userId);
        if (!betData) throw new Error('No active bet found');
        if (betData.cashedOut) throw new Error('Already cashed out');

        // Lock the exact multiplier they clicked *mathematically*
        const lockedMultiplier = this.currentMultiplier;
        
        // Edge case security: If the socket lag let them click at 2.50x but it already crashed at 2.45x
        if (lockedMultiplier > this.crashPoint || this.state === 'CRASHED') {
            throw new Error('Crashed before cashout was valid!');
        }

        const winAmount = parseFloat((betData.amount * lockedMultiplier).toFixed(6));

        // Use ACID Transaction strictly as user requested
        await TransactionHelper.runTransaction(async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error('User missing in cashout');

            const initBal = parseFloat(user.wallet?.main || 0);
            const finalBal = initBal + winAmount;

            user.wallet.main = finalBal;
            user.markModified('wallet.main');
            await user.save({ session });

            const trxId = `CRASH_WIN_${this.roundId}_${userId}`;

            await TransactionLedger.create([{
                userId, type: 'credit', amount: winAmount,
                balanceBefore: initBal, balanceAfter: finalBal,
                description: `Crash Cashed Out @${lockedMultiplier}x`,
                transactionId: trxId
            }], { session, ordered: true });

            // UI Transaction (Net profit = Win - Initial Bet)
            const netProfit = winAmount - betData.amount;
            await Transaction.create([{
                userId, type: netProfit >= 0 ? 'game_win' : 'game_neutral',
                amount: netProfit,
                status: 'completed',
                description: `Crash Flight (${lockedMultiplier}x)`,
                source: 'game',
                recipientDetails: `Win: ${winAmount} NXS`,
                transactionId: `${trxId}_UI`
            }], { session, ordered: true });
        });

        // Update local memory
        this.bets.set(userId, { amount: betData.amount, cashedOut: true, payout: winAmount });
        
        // Invalidate Redis profile sync so header updates instantly
        try {
            const redis = require('../../config/redis');
            await redis.client.del(`user_profile:${userId}`);
        } catch (e) { }

        // Blast to everyone that this user jumped ship
        this.io.emit('user_cashed_out', { userId, payout: winAmount, multiplier: lockedMultiplier });

        return { success: true, payout: winAmount, multiplier: lockedMultiplier };
    }
}

// Export a singleton
const crashGameSingleton = new CrashGameManager();
module.exports = crashGameSingleton;
