const GameVault = require('./GameVaultModel');

class UniversalMatchMaker {
    constructor() {
        this.queues = {};
        this.DEFAULT_WINDOW_MS = 1500; 
    }

    async processMatch(userId, betAmount, gameType = 'spin', customWindowMs = null) {
        return new Promise(async (resolve, reject) => {
            const vault = await GameVault.getMasterVault();
            if (!vault.config.isEnabled) {
                return reject(new Error('Game engine is currently disabled by admin (Kill Switch).'));
            }

            if (!this.queues[gameType]) {
                this.queues[gameType] = { players: [], timeout: null, isProcessing: false };
            }
            const q = this.queues[gameType];
            q.players.push({ userId, betAmount, resolve, reject, timestamp: Date.now() });
            const windowMs = customWindowMs || this.DEFAULT_WINDOW_MS;
            if (q.players.length >= 2) this.triggerMatch(gameType);
            else if (!q.timeout) q.timeout = setTimeout(() => this.triggerMatch(gameType), windowMs);
        });
    }

    flushQueues() {
        for (let game in this.queues) {
            const q = this.queues[game];
            for (let p of q.players) {
                p.reject(new Error("Engine flushed by admin. Bet cancelled."));
            }
            if (q.timeout) clearTimeout(q.timeout);
        }
        this.queues = {};
        console.log("[UniversalMatchMaker] Queues flushed!");
    }

    async triggerMatch(gameType) {
        const q = this.queues[gameType];
        if (!q || q.isProcessing) return;
        q.isProcessing = true;
        if (q.timeout) { clearTimeout(q.timeout); q.timeout = null; }

        try {
            while (q.players.length > 0) {
                let batch = q.players.length >= 2 ? q.players.splice(0, 2) : q.players.splice(0, 1);
                const isDuo = batch.length === 2;
                
                // 1. Fetch current Vault Snapshot
                const vault = await GameVault.getMasterVault();
                
                // [NEW] Redis Live Match Pot Initialization
                const RedisService = require('../../services/RedisService');
                const P2PAudit = require('./P2PAuditModel');
                let redisLivePot = await RedisService.get('livedata:game:match_pot');
                if (redisLivePot === null) {
                    redisLivePot = 0; // Initialize if empty
                } else {
                    redisLivePot = parseFloat(redisLivePot);
                }
                
                // 2. Triple Stream Distribution Setup
                const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);
                const adminIncomeIn = totalBet * 0.10;
                const userInterestIn = totalBet * 0.15;
                const activePoolIn = totalBet * 0.75; // Goes to Redis!

                // Atomically add incoming funds to Redis
                if (activePoolIn > 0) {
                    redisLivePot = await RedisService.client.incrByFloat('livedata:game:match_pot', activePoolIn);
                }

                const redisPotBefore = redisLivePot - activePoolIn;

                // Active variables for calculations
                let currentUserInterest = vault.balances.userInterest + userInterestIn;
                const hardStop = vault.config.hardStopLimit;
                const isTightMode = redisLivePot < vault.config.tightModeThreshold;
                const houseEdgeModifier = Math.max(0, (100 - (vault.config.houseEdge || 10)) / 90);

                let totalActiveDeduct = 0;
                let totalInterestDeduct = 0;
                let fallbackMongoDeduct = 0;
                let payoutSource = 'redis_pot';
                let auditPlayers = [];

                // 3. Process Batch
                for (let i = 0; i < batch.length; i++) {
                    const p = batch[i];
                    let rtpMult = 0.0;
                    let label = 'LOSS';
                    let rank = 8;

                    // Get base multiplier based on game logic
                    if (gameType === 'scratch') {
                        const res = this.getScratchBaseRTP(p.betAmount, isTightMode, houseEdgeModifier);
                        rtpMult = res.mult; label = res.label; rank = res.rank;
                    } else if (gameType === 'spin') {
                        const res = this.getSpinBaseRTP(isTightMode, houseEdgeModifier);
                        rtpMult = res.mult; label = res.label; rank = res.rank;
                    } else { // Fallback / Gift
                        const res = this.getFallbackBaseRTP(isTightMode, houseEdgeModifier);
                        rtpMult = res.mult; label = res.label; rank = res.rank;
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
                        const safeOutcome = this.getDowngradedOutcome(gameType, p.betAmount, maxAllowedPayout, true);
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
                    gameType,
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
                            event: `${batch.length} player(s) played ${gameType.toUpperCase()}`,
                            payout: totalPayoutStr,
                            timestamp: Date.now()
                        });
                    }
                } catch(e) { }

            }
        } finally { q.isProcessing = false; }
    }

    getScratchBaseRTP(bet, isTightMode, houseEdgeModifier = 1) {
        const rng = (Math.random() * 100) / houseEdgeModifier; // Higher edge = lower effective chance
        let mult = 0; let label = 'LOSS'; let rank = 8;
        
        if (rng < 2 && !isTightMode) { mult = 10.0; label = 'LEGENDARY'; rank = 1; }
        else if (rng < 8 && !isTightMode) { mult = 5.0; label = 'EPIC'; rank = 1; }
        else if (rng < 20) { mult = 2.0; label = 'PROFIT'; rank = 2; }
        else if (rng < 45) { mult = 1.0; label = 'REFUND'; rank = 2; }
        else if (rng < 70) { mult = 0.5; label = 'CONSOLATION'; rank = 3; }
        else { mult = 0.0; label = 'LOSS'; rank = 8; }
        
        // Golden Tiers specifically shouldn't be penalized if tight mode is off
        return { mult, label, rank };
    }

    getSpinBaseRTP(isTightMode, houseEdgeModifier = 1) {
        const rng = (Math.random() * 100) / houseEdgeModifier;
        let mult = 0.0; let label = 'LOSS'; let rank = 8;
        
        if (rng < 2 && !isTightMode) { mult = 5.0; label = 'JACKPOT'; rank = 1; }
        else if (rng < 6 && !isTightMode) { mult = 3.0; label = 'MEGA WIN'; rank = 1; }
        else if (rng < 15) { mult = 2.0; label = 'BIG WIN'; rank = 2; }
        else if (rng < 30) { mult = 1.5; label = 'PROFIT'; rank = 2; }
        else if (rng < 55) { mult = 1.0; label = 'REFUND'; rank = 3; }
        else if (rng < 80) { mult = 0.5; label = 'CONSOLATION'; rank = 4; }
        else { mult = 0.0; label = 'MISS'; rank = 8; }

        return { mult, label, rank };
    }

    getFallbackBaseRTP(isTightMode, houseEdgeModifier = 1) {
        const rng = (Math.random() * 100) / houseEdgeModifier;
        if (rng < 5 && !isTightMode) return { mult: 3.0, label: 'MEGA BOX', rank: 1 };
        if (rng < 15) return { mult: 1.5, label: 'LUCKY BOX', rank: 2 };
        if (rng < 40) return { mult: 0.8, label: 'CONSOLATION', rank: 3 };
        return { mult: 0.0, label: 'EMPTY BOX', rank: 8 };
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
