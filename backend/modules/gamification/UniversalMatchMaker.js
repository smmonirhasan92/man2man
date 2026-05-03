const GameVault = require('./GameVaultModel');
const RedisService = require('../../services/RedisService');
const P2PAudit = require('./P2PAuditModel');
const SocketService = require('../common/SocketService');
const TransactionHelper = require('../common/TransactionHelper');
const crypto = require('crypto');

const UNIVERSAL_MULTIPLIERS = [5, 3.3, 2.6, 2, 1.5, 1, 0.5, 0];

class UniversalMatchMaker {
    constructor() {
        this.globalQueue = { players: [], timeout: null, isProcessing: false };
        this.DEFAULT_WINDOW_MS = 1000;
    }

    async getDynamicConfig() {
        let isEnabled = await RedisService.get('config:isEnabled');
        let houseEdge = await RedisService.get('config:houseEdge');
        
        if (isEnabled === null || houseEdge === null) {
            const vault = await GameVault.getMasterVault();
            if (vault) {
                // Populate Cache for High-Traffic performance
                await RedisService.client.set('config:isEnabled', vault.config.isEnabled ? 'true' : 'false', 'EX', 3600);
                await RedisService.client.set('config:houseEdge', vault.config.houseEdge.toString(), 'EX', 3600);
                return { isEnabled: vault.config.isEnabled, houseEdge: vault.config.houseEdge };
            }
        }
        return { isEnabled: isEnabled === 'true', houseEdge: parseFloat(houseEdge) || 10 };
    }

    async processMatch(userId, betAmount, gameType = 'spin', tier = 'bronze', customWindowMs = null, consecutiveLosses = 0, username = 'Unknown') {
        return new Promise(async (resolve, reject) => {
            const config = await this.getDynamicConfig();
            if (!config.isEnabled) {
                return reject(new Error('Game engine is currently disabled by admin (Kill Switch).'));
            }

            const q = this.globalQueue;
            q.players.push({ userId, username, betAmount, gameType, tier, consecutiveLosses, resolve, reject, timestamp: Date.now() });
            
            const windowMs = customWindowMs || this.DEFAULT_WINDOW_MS;
            
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
    }

    async triggerMatch() {
        if (this.globalQueue.isProcessing) return;
        this.globalQueue.isProcessing = true;
        clearTimeout(this.globalQueue.timeout);
        this.globalQueue.timeout = null;

        const q = this.globalQueue;
        const batch = q.players.splice(0, q.players.length);
        this.globalQueue.isProcessing = false;

        if (batch.length === 0) return;

        try {
            // [PHASE 3] PROVABLY FAIR SEED GENERATION
            const serverSeed = crypto.randomBytes(32).toString('hex');
            const batchId = crypto.createHash('md5').update(serverSeed + Date.now()).digest('hex');

            const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);
            const isMultiplayer = batch.length > 1;

            // [PHASE 3] FINANCIAL RECOVERY MODE (< 50 NXS)
            let redisLivePotStr = await RedisService.get('livedata:game:match_pot');
            let redisLivePot = parseFloat(redisLivePotStr || 0);
            const isEmergencyRecovery = redisLivePot < 50;

            let houseEdgePct = 0.10; 
            if (isMultiplayer) houseEdgePct = 0.15; 
            if (isEmergencyRecovery) houseEdgePct = 0.40; 

            const totalFeeIn = parseFloat((totalBet * houseEdgePct).toFixed(2));
            const adminFeeIn = totalFeeIn * 0.40;
            const interestFeeIn = totalFeeIn * 0.40;
            const activePoolIn = totalBet - totalFeeIn;

            // Atomic contribution to Redis Pot
            await RedisService.client.incrByFloat('livedata:game:match_pot', activePoolIn);
            
            // [PHASE 2] Visual Thrill: Signal players
            if (isMultiplayer) {
                batch.forEach(p => {
                    SocketService.emitToUser(p.userId, 'p2p_match_found', { 
                        opponentCount: batch.length - 1,
                        batchId 
                    });
                });
            }

            // [PHASE 3] WEIGHTED RANDOMNESS MATH
            const weightedPlayers = batch.map(p => ({
                ...p,
                probability: p.betAmount / totalBet
            }));
            
            const pickWinner = (players) => {
                const r = crypto.randomInt(1000) / 1000;
                let cumulative = 0;
                for (const p of players) {
                    cumulative += p.probability;
                    if (r <= cumulative) return p;
                }
                return players[0];
            };

            const mainWinner = pickWinner(weightedPlayers);

            // [PHASE 3] PERCENTAGE-BASED JACKPOT RELEASE
            const handleBonusDrops = async (winner) => {
                const megaFundStr = await RedisService.get('livedata:game:fund_mega');
                const megaFund = parseFloat(megaFundStr || 0);
                const r = crypto.randomInt(100);
                
                // Only Gold/Silver bets (6+ NXS) have chance for Mega Drops
                if (winner.betAmount >= 6 && megaFund > 100 && r < 5) {
                    const dropPct = (crypto.randomInt(5, 15)) / 100;
                    const dropAmt = parseFloat((megaFund * dropPct).toFixed(2));
                    await RedisService.client.incrByFloat('livedata:game:fund_mega', -dropAmt);
                    return { amount: dropAmt, label: 'MEGA SURPRISE' };
                }
                return null;
            };

            let totalBasePayouts = 0;

            // Process results
            for (const p of batch) {
                let winAmount = 0;
                let label = 'Miss';
                let isWin = false;
                let bonusAmount = 0;

                // [ZERO-INFLATION P2P] 
                // System MUST NOT create money. All wins come from the existing Pool.
                let safetyMargin = 0.90; // Only 90% of pool is ever touchable by the engine
                let availableToPay = activePoolIn * safetyMargin;
                
                if (availableToPay <= 0) {
                    // CRITICAL: Pool is empty. No one wins until more bets are placed or admin seeds.
                    winAmount = 0;
                    isWin = false;
                    label = 'Miss';
                } else if (p.userId === mainWinner.userId) {
                    // Winner gets a share of the pool, capped at what's actually there.
                    winAmount = Math.min(activePoolIn * 0.8, availableToPay); 
                    isWin = true;
                    label = 'Jackpot';

                    const bonus = await handleBonusDrops(p);
                    if (bonus) {
                        // Mega Drops only from MEGA_FUND (Redis), never from System Balance.
                        bonusAmount = bonus.amount;
                        winAmount += bonus.amount;
                        label = bonus.label;
                    }
                } else if (p.consecutiveLosses >= 5 && availableToPay > (p.betAmount * 0.5)) {
                    // Minor refund ONLY if pool has significant surplus
                    winAmount = p.betAmount * 0.3;
                    label = 'Consolation';
                    isWin = false;
                }

                // Final Safeguard: Never let totalBasePayouts exceed the income of this batch
                if ((totalBasePayouts + winAmount - bonusAmount) > activePoolIn) {
                    winAmount = 0; // Forced stop to prevent inflation
                }

                winAmount = Math.max(0, winAmount);
                totalBasePayouts += (winAmount - bonusAmount);

                // [FIX] Calculate accurate Slice Index for Visual-Sync
                const visualData = this.getVisualSliceIndex(p.tier, winAmount, p.gameType, p.betAmount);
                
                p.resolve({
                    winAmount: parseFloat(winAmount.toFixed(2)),
                    isWin,
                    label,
                    mode: isMultiplayer ? 'p2p' : 'single',
                    sliceIndex: visualData.index, // [SYNCED] Wheel will stop at exact multiplier!
                    batchId
                });
            }

            // Sync to MongoDB Audit Atomically
            await TransactionHelper.runTransaction(async (session) => {
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.adminIncome': adminFeeIn,
                        'balances.userInterest': interestFeeIn,
                        'balances.activePool': parseFloat((activePoolIn - totalBasePayouts).toFixed(2)) // 100% Accurate Sync
                    }
                }, { session });
            });

            // [REAL-TIME SYNC] Push updated Vault state to Admin Dashboard
            const updatedVault = await GameVault.findOne({ vaultId: 'MASTER_VAULT' }).lean();
            if (updatedVault) {
                SocketService.broadcast('admin_dashboard', 'vault_update', {
                    adminIncome: updatedVault.balances.adminIncome,
                    activePool: updatedVault.balances.activePool,
                    userInterest: updatedVault.balances.userInterest,
                    megaWin: await RedisService.get('livedata:game:fund_mega'), // Sync Live Pools too
                    timestamp: Date.now()
                });
            }

            // Admin Activity Feed Broadcast
            SocketService.broadcast('admin_dashboard', 'activity_feed', {
                game: batch[0].gameType,
                totalBet,
                batchId,
                timestamp: Date.now()
            });

        } catch (err) {
            console.error('[ENGINE ERROR]', err);
            batch.forEach(p => p.resolve({ winAmount: 0, isWin: false, label: 'Engine Error' }));
        }
    }
    getVisualSliceIndex(tier, winAmount, gameType, betAmount) {
        if (gameType !== 'spin') return { index: 7, amount: winAmount }; // Not a wheel game

        const mult = parseFloat((winAmount / (betAmount || 5)).toFixed(1));
        
        // Dynamic search for closest multiplier match
        let bestIndex = 7; // Default to Loss (Index 7)
        let minDiff = Infinity;

        for (let i = 0; i < UNIVERSAL_MULTIPLIERS.length; i++) {
            const diff = Math.abs(UNIVERSAL_MULTIPLIERS[i] - mult);
            if (diff < minDiff) {
                minDiff = diff;
                bestIndex = i;
            }
        }

        return { index: bestIndex, amount: winAmount };
    }
}

module.exports = new UniversalMatchMaker();
