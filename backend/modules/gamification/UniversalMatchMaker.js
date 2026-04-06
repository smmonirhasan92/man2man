const GameVault = require('./GameVaultModel');

class UniversalMatchMaker {
    constructor() {
        this.globalQueue = { players: [], timeout: null, isProcessing: false };
        this.DEFAULT_WINDOW_MS = 2500; 
    }

    async processMatch(userId, betAmount, gameType = 'spin', customWindowMs = null) {
        return new Promise(async (resolve, reject) => {
            const vault = await GameVault.getMasterVault();
            if (!vault.config.isEnabled) {
                return reject(new Error('Game engine is currently disabled by admin (Kill Switch).'));
            }

            const q = this.globalQueue;
            q.players.push({ userId, betAmount, gameType, resolve, reject, timestamp: Date.now() });
            
            const windowMs = customWindowMs || this.DEFAULT_WINDOW_MS;
            
            // Soft absolute cap to prevent memory issues or lag (15 players)
            if (q.players.length >= 15) {
                this.triggerMatch();
            } else if (!q.timeout) {
                q.timeout = setTimeout(() => this.triggerMatch(), windowMs);
            }
        });
    }

    flushQueues() {
        const q = this.globalQueue;
        for (let p of q.players) {
            p.reject(new Error("Engine flushed by admin. Bet cancelled."));
        }
        if (q.timeout) clearTimeout(q.timeout);
        this.globalQueue = { players: [], timeout: null, isProcessing: false };
        console.log("[UniversalMatchMaker] Global Queue flushed!");
    }

    async triggerMatch() {
        const q = this.globalQueue;
        if (!q || q.isProcessing || q.players.length === 0) return;
        q.isProcessing = true;
        if (q.timeout) { clearTimeout(q.timeout); q.timeout = null; }

        try {
            while (q.players.length > 0) {
                // Take the entire accumulated batch
                let batch = q.players.splice(0, q.players.length);
                const isDuo = batch.length > 1;
                
                // 1. Fetch current Vault Snapshot
                const vault = await GameVault.getMasterVault();
                
                // [NEW] Redis Live Match Pot Initialization
                const RedisService = require('../../services/RedisService');
                const P2PAudit = require('./P2PAuditModel');
                let redisLivePot = await RedisService.get('livedata:game:match_pot');
                if (redisLivePot === null) {
                    redisLivePot = vault.balances.activePool; 
                    if (redisLivePot > 0) await RedisService.client.set('livedata:game:match_pot', redisLivePot);
                    else redisLivePot = 0;
                } else {
                    redisLivePot = parseFloat(redisLivePot);
                }
                
                // 2. Triple Stream Distribution Setup for Entire Global Batch
                const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);
                const adminIncomeIn = totalBet * 0.10;
                const userInterestIn = totalBet * 0.15;
                const activePoolIn = totalBet * 0.75; // Goes to Redis!

                // Atomically add incoming funds to Redis BEFORE calculating wins
                if (activePoolIn > 0) {
                    redisLivePot = await RedisService.client.incrByFloat('livedata:game:match_pot', activePoolIn);
                }

                const redisPotBefore = redisLivePot - activePoolIn;

                // Active variables for calculations
                let currentUserInterest = vault.balances.userInterest + userInterestIn;
                const hardStop = vault.config.hardStopLimit;
                const isTightMode = redisLivePot < vault.config.tightModeThreshold;

                let totalActiveDeduct = 0;
                let totalInterestDeduct = 0;
                let fallbackMongoDeduct = 0;
                let payoutSource = 'redis_pot';
                let auditPlayers = [];

                // 3. Process Batch with WHALE SACRIFICE LOGIC
                // Sort descending to tackle the highest bettor first
                batch.sort((a, b) => b.betAmount - a.betAmount);

                for (let i = 0; i < batch.length; i++) {
                    const p = batch[i];
                    let rtpMult = 0.0;
                    let label = 'LOSS';
                    let rank = 8;
                    
                    // SACRIFICE LOGIC
                    let isSacrificialWhale = false;
                    if (isTightMode && batch.length > 1 && i === 0) {
                        const nextHighestBet = batch[1].betAmount;
                        // Determine if Whale's bet dominates the queue pool
                        if (p.betAmount > nextHighestBet * 1.5) {
                            // 80% chance to sacrifice whale to feed the remaining small bettors
                            if (Math.random() < 0.8) {
                                isSacrificialWhale = true;
                            }
                        }
                    }

                    if (isSacrificialWhale) {
                         rtpMult = 0.0;
                         if (p.gameType === 'scratch') label = 'LOSS';
                         else if (p.gameType === 'spin') label = 'MISS';
                         else label = 'EMPTY BOX';
                         rank = 8;
                    } else {
                        // Get base multiplier based on game logic
                        if (p.gameType === 'scratch') {
                            const res = this.getScratchBaseRTP(p.betAmount, isTightMode);
                            rtpMult = res.mult; label = res.label; rank = res.rank;
                        } else if (p.gameType === 'spin') {
                            const res = this.getSpinBaseRTP(isTightMode);
                            rtpMult = res.mult; label = res.label; rank = res.rank;
                        } else { // Fallback / Gift
                            const res = this.getFallbackBaseRTP(isTightMode);
                            rtpMult = res.mult; label = res.label; rank = res.rank;
                        }
                    }

                    // Payout Calculation
                    let targetPayout = p.betAmount * rtpMult;
                    
                    // Determine maximum funding we can assemble
                    let availableFunding = redisLivePot;
                    let boostInterest = 0;
                    let boostMongo = 0;

                    if (targetPayout > availableFunding && currentUserInterest > 0 && !isTightMode) {
                        boostInterest = Math.min(targetPayout - availableFunding, currentUserInterest);
                        availableFunding += boostInterest;
                    }

                    if (targetPayout > availableFunding && !isTightMode) {
                        const availableMongoPool = vault.balances.activePool - fallbackMongoDeduct;
                        if (availableMongoPool > 0) {
                            boostMongo = Math.min(targetPayout - availableFunding, availableMongoPool);
                            availableFunding += boostMongo;
                        }
                    }

                    // HARD STOP checks against theoretical availability
                    let maxAllowedPayout = Math.min(availableFunding, hardStop);

                    if (targetPayout > maxAllowedPayout) {
                        // Apply mathematical downgrade so we hit a clear discrete multiplier
                        const safeOutcome = this.getDowngradedOutcome(p.gameType, p.betAmount, maxAllowedPayout, true);
                        targetPayout = safeOutcome.adjustedPayout;
                        rtpMult = safeOutcome.newMult;
                        label = safeOutcome.newLabel;
                        rank = safeOutcome.newRank;
                        if (boostMongo > 0) payoutSource = 'mixed_safe';
                    } else {
                        if (boostMongo > 0) payoutSource = 'mixed';
                    }

                    let actualPayout = targetPayout;
                    let usedInterest = 0;
                    let usedMongo = 0;

                    if (actualPayout > redisLivePot) {
                        let remainder = actualPayout - redisLivePot;
                        usedInterest = Math.min(remainder, currentUserInterest);
                        remainder -= usedInterest;
                        if (remainder > 0) {
                            usedMongo = remainder;
                        }
                    }
                    fallbackMongoDeduct += usedMongo;

                    // Bookkepping
                    const activePoolPayout = actualPayout - usedInterest - (fallbackMongoDeduct > 0 ? fallbackMongoDeduct : 0);
                    redisLivePot -= activePoolPayout;
                    currentUserInterest -= usedInterest;
                    
                    totalActiveDeduct += activePoolPayout;
                    totalInterestDeduct += usedInterest;

                    auditPlayers.push({
                        userId: p.userId,
                        betAmount: p.betAmount,
                        winAmount: parseFloat(actualPayout.toFixed(2)),
                        netProfit: parseFloat((actualPayout - p.betAmount).toFixed(2))
                    });

                    // Delay resolution
                    p.finalOutcome = {
                        winAmount: parseFloat(actualPayout.toFixed(2)),
                        isWin: actualPayout > 0,
                        label: label,
                        rank: rank,
                        mode: isDuo ? 'p2p' : 'single',
                        pool: parseFloat(redisLivePot.toFixed(2))
                    };
                }

                // 3.5 Deduct from Redis atomically
                if (totalActiveDeduct > 0) {
                    redisLivePot = await RedisService.client.incrByFloat('livedata:game:match_pot', -totalActiveDeduct);
                }

                // 4. Atomic Database Update ($inc) & Ledger
                // Only ActivePool fallback and Interest/Admin touch DB
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.adminIncome': adminIncomeIn,
                        'balances.userInterest': userInterestIn - totalInterestDeduct,
                        'balances.activePool': -fallbackMongoDeduct, // Main pool is now Redis
                        'stats.totalBetsIn': totalBet,
                        'stats.totalPayoutsOut': totalActiveDeduct + totalInterestDeduct + fallbackMongoDeduct,
                        'stats.totalGamesPlayed': batch.length
                    }
                });

                await P2PAudit.create({
                    gameType: 'GLOBAL_BATCH',
                    players: auditPlayers,
                    financials: {
                        totalBetIn: totalBet,
                        adminFeeDeducted: adminIncomeIn,
                        interestFundDeducted: userInterestIn,
                        redisPotContribution: activePoolIn,
                        totalPayoutOut: totalActiveDeduct + totalInterestDeduct + fallbackMongoDeduct,
                        payoutSource
                    },
                    redisPotState: { before: redisPotBefore, after: redisLivePot }
                });

                // 5. Finalize Promises
                for (let p of batch) {
                    p.resolve(p.finalOutcome);
                }

                // [NEW] Push to Admin Live Feed
                try {
                    const SocketService = require('../common/SocketService');
                    if (SocketService) {
                        const totalPayoutStr = (totalActiveDeduct + totalInterestDeduct + fallbackMongoDeduct).toFixed(2);
                        SocketService.broadcast('admin_dashboard', 'activity_feed', {
                            event: `${batch.length} player(s) played P2P MULTI-GAME`,
                            payout: totalPayoutStr,
                            timestamp: Date.now()
                        });
                    }
                } catch(e) { }

            }
        } finally { q.isProcessing = false; }
    }

    getScratchBaseRTP(bet, isTightMode) {
        const rng = Math.random() * 100;
        let mult = 0; let label = 'LOSS'; let rank = 8;
        
        if (!isTightMode) {
            if (rng < 2) { mult = 10.0; label = 'LEGENDARY'; rank = 1; }
            else if (rng < 8) { mult = 5.0; label = 'EPIC'; rank = 1; }
            else if (rng < 20) { mult = 2.0; label = 'PROFIT'; rank = 2; }
            else if (rng < 45) { mult = 1.0; label = 'REFUND'; rank = 2; }
            else if (rng < 70) { mult = 0.5; label = 'CONSOLATION'; rank = 3; }
            else { mult = 0.0; label = 'LOSS'; rank = 8; }
        } else {
            // Tight mode: Pot recovery (RTP < 75%)
            if (rng < 15) { mult = 1.0; label = 'REFUND'; rank = 2; }
            else if (rng < 50) { mult = 0.5; label = 'CONSOLATION'; rank = 3; }
            else { mult = 0.0; label = 'LOSS'; rank = 8; }
        }
        return { mult, label, rank };
    }

    getSpinBaseRTP(isTightMode) {
        const rng = Math.random() * 100;
        let mult = 0.0; let label = 'LOSS'; let rank = 8;
        
        if (!isTightMode) {
            if (rng < 2) { mult = 5.0; label = 'JACKPOT'; rank = 1; }
            else if (rng < 6) { mult = 3.0; label = 'MEGA WIN'; rank = 1; }
            else if (rng < 15) { mult = 2.0; label = 'BIG WIN'; rank = 2; }
            else if (rng < 30) { mult = 1.5; label = 'PROFIT'; rank = 2; }
            else if (rng < 55) { mult = 1.0; label = 'REFUND'; rank = 3; }
            else if (rng < 80) { mult = 0.5; label = 'CONSOLATION'; rank = 4; }
            else { mult = 0.0; label = 'MISS'; rank = 8; }
        } else {
            // Tight mode: Pot recovery (RTP < 75%)
            if (rng < 20) { mult = 1.0; label = 'REFUND'; rank = 3; }
            else if (rng < 60) { mult = 0.5; label = 'CONSOLATION'; rank = 4; }
            else { mult = 0.0; label = 'MISS'; rank = 8; }
        }
        return { mult, label, rank };
    }

    getFallbackBaseRTP(isTightMode) {
        const rng = Math.random() * 100;
        if (!isTightMode) {
            if (rng < 5) return { mult: 3.0, label: 'MEGA BOX', rank: 1 };
            if (rng < 15) return { mult: 1.5, label: 'LUCKY BOX', rank: 2 };
            if (rng < 40) return { mult: 0.8, label: 'CONSOLATION', rank: 3 };
            return { mult: 0.0, label: 'EMPTY BOX', rank: 8 };
        } else {
            if (rng < 25) return { mult: 0.8, label: 'CONSOLATION', rank: 3 };
            return { mult: 0.0, label: 'EMPTY BOX', rank: 8 };
        }
    }
    getDowngradedOutcome(gameType, pBetAmount, actualPayout, isSafe) {
        if (pBetAmount <= 0) return { newMult: 0, newLabel: 'LOSS', newRank: 8, adjustedPayout: 0 };
        const allowedMult = actualPayout / pBetAmount;
        let newMult = 0.0;
        let newLabel = 'LOSS';
        let newRank = 8;
        
        if (gameType === 'spin') {
            if (allowedMult >= 5.0) { newMult = 5.0; newLabel = 'JACKPOT'; newRank = 1; }
            else if (allowedMult >= 3.0) { newMult = 3.0; newLabel = 'MEGA WIN'; newRank = 1; }
            else if (allowedMult >= 2.0) { newMult = 2.0; newLabel = 'BIG WIN'; newRank = 2; }
            else if (allowedMult >= 1.5) { newMult = 1.5; newLabel = 'PROFIT'; newRank = 2; }
            else if (allowedMult >= 1.0) { newMult = 1.0; newLabel = 'REFUND'; newRank = 3; }
            else if (allowedMult >= 0.5) { newMult = 0.5; newLabel = 'CONSOLATION'; newRank = 4; }
            else { newMult = 0.0; newLabel = 'MISS'; newRank = 8; }
        } else if (gameType === 'scratch') {
            if (allowedMult >= 10.0) { newMult = 10.0; newLabel = 'LEGENDARY'; newRank = 1; }
            else if (allowedMult >= 5.0) { newMult = 5.0; newLabel = 'EPIC'; newRank = 1; }
            else if (allowedMult >= 2.0) { newMult = 2.0; newLabel = 'PROFIT'; newRank = 2; }
            else if (allowedMult >= 1.0) { newMult = 1.0; newLabel = 'REFUND'; newRank = 2; }
            else if (allowedMult >= 0.5) { newMult = 0.5; newLabel = 'CONSOLATION'; newRank = 3; }
            else { newMult = 0.0; newLabel = 'LOSS'; newRank = 8; }
        } else { // gift
            if (allowedMult >= 3.0) { newMult = 3.0; newLabel = 'MEGA BOX'; newRank = 1; }
            else if (allowedMult >= 1.5) { newMult = 1.5; newLabel = 'LUCKY BOX'; newRank = 2; }
            else if (allowedMult >= 0.8) { newMult = 0.8; newLabel = 'CONSOLATION'; newRank = 3; }
            else { newMult = 0.0; newLabel = 'EMPTY BOX'; newRank = 8; }
        }

        if (isSafe && newMult > 0 && newMult <= 1.0) {
           newLabel = newLabel + ' (SAFE)';
        } else if (isSafe && newMult === 0) {
           newLabel = newLabel + ' (SAFE)';
        }

        return { newMult, newLabel, newRank, adjustedPayout: pBetAmount * newMult };
    }
}

module.exports = new UniversalMatchMaker();
