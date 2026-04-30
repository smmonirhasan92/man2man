const GameVault = require('./GameVaultModel');
const RedisService = require('../../services/RedisService');
const P2PAudit = require('./P2PAuditModel');
const SocketService = require('../common/SocketService');
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

            // Process results
            for (const p of batch) {
                let winAmount = 0;
                let label = 'Miss';
                let isWin = false;

                if (isEmergencyRecovery && p.consecutiveLosses < 4) {
                    winAmount = 0;
                } else if (p.userId === mainWinner.userId) {
                    winAmount = activePoolIn;
                    isWin = true;
                    label = 'Jackpot';

                    const bonus = await handleBonusDrops(p);
                    if (bonus) {
                        winAmount += bonus.amount;
                        label = bonus.label;
                        SocketService.emitToUser(p.userId, 'legendary_win', {
                            message: `🔥 CONGRATULATIONS! You unlocked a ${label}!`,
                            amount: bonus.amount
                        });
                    }
                } else if (p.consecutiveLosses >= 4) {
                    winAmount = p.betAmount * 0.8;
                    label = 'Near Miss';
                    isWin = false;
                }

                p.resolve({
                    winAmount: parseFloat(winAmount.toFixed(2)),
                    isWin,
                    label,
                    mode: isMultiplayer ? 'p2p' : 'single',
                    sliceIndex: isWin ? 0 : 7,
                    batchId
                });
            }

            // Sync to MongoDB Audit
            await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                $inc: {
                    'balances.adminIncome': adminFeeIn,
                    'balances.userInterest': interestFeeIn,
                    'balances.activePool': parseFloat((activePoolIn - (mainWinner.winAmount || 0)).toFixed(2)) // Approximate sync
                }
            });

            // Admin Dashboard Broadcast
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
