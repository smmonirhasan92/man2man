const GameVault = require('./GameVaultModel');
const RedisService = require('../../services/RedisService');
const P2PAudit = require('./P2PAuditModel');

class UniversalMatchMaker {
    constructor() {
        this.globalQueue = { players: [], timeout: null, isProcessing: false };
        this.DEFAULT_WINDOW_MS = 2500; 
    }

    async getDynamicConfig() {
        let isEnabled = await RedisService.get('config:isEnabled');
        let houseEdge = await RedisService.get('config:houseEdge');
        if (isEnabled === null) {
            const vault = await GameVault.getMasterVault();
            return { isEnabled: vault.config.isEnabled, houseEdge: vault.config.houseEdge };
        }
        return { isEnabled: isEnabled === 'true', houseEdge: parseFloat(houseEdge) };
    }

    async processMatch(userId, betAmount, gameType = 'spin', tier = 'bronze', customWindowMs = null) {
        return new Promise(async (resolve, reject) => {
            const config = await this.getDynamicConfig();
            if (!config.isEnabled) {
                return reject(new Error('Game engine is currently disabled by admin (Kill Switch).'));
            }

            const q = this.globalQueue;
            q.players.push({ userId, betAmount, gameType, tier, resolve, reject, timestamp: Date.now() });
            
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
        const q = this.globalQueue;
        if (!q || q.isProcessing || q.players.length === 0) return;
        q.isProcessing = true;
        if (q.timeout) { clearTimeout(q.timeout); q.timeout = null; }

        try {
            while (q.players.length > 0) {
                let batch = q.players.splice(0, q.players.length);
                const isMultiplayer = batch.length > 1;
                console.log(`[ENGINE] Processing Batch: Size=${batch.length}, Multiplayer=${isMultiplayer}`);
                
                const config = await this.getDynamicConfig();
                
                const currentMinute = new Date().getMinutes();
                const isPhaseA = currentMinute % 6 < 3; // 0-2 (Win Mode), 3-5 (Recovery)

                let redisLivePotStr = await RedisService.get('livedata:game:match_pot');
                let redisLivePot = redisLivePotStr ? parseFloat(redisLivePotStr) : 0;
                
                const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);
                
                // [RESTORED] Original 50/50 Fee Split Logic
                const houseEdgePct = isMultiplayer ? 0.15 : (config.houseEdge / 100);
                const totalFeeIn = parseFloat((totalBet * houseEdgePct).toFixed(2)); 
                const adminIncomeIn = parseFloat((totalFeeIn * 0.5).toFixed(2)); 
                const reinjectionPadIn = parseFloat((totalFeeIn - adminIncomeIn).toFixed(2)); 
                
                if (reinjectionPadIn > 0) {
                    await RedisService.client.incrByFloat('livedata:game:admin_reinjection_pad', reinjectionPadIn);
                    console.log(`[REFILL] Pad +${reinjectionPadIn} NXS (from 50% split)`);
                }
                
                if (totalFeeIn > 0) {
                    console.log(`[ENGINE] Fee: ${totalFeeIn} (Admin: ${adminIncomeIn}, Pad: ${reinjectionPadIn})`);
                }
                
                const activePoolIn = parseFloat((totalBet - totalFeeIn).toFixed(2)); // Main pot gets the exact remainder

                if (activePoolIn > 0) {
                    redisLivePot = await RedisService.client.incrByFloat('livedata:game:match_pot', activePoolIn);
                }
                const redisPotBefore = redisLivePot - activePoolIn;

                // Net Loss Hourly tracking
                const hourPrefix = new Date().toISOString().slice(0, 13);
                const hourlyKey = `livedata:game:hourly_net_loss:${hourPrefix}`;
                let hourlyNetLossStr = await RedisService.get(hourlyKey);
                let hourlyNetLoss = hourlyNetLossStr ? parseFloat(hourlyNetLossStr) : 0;

                // Dynamically expanding budget
                let padStr = await RedisService.get('livedata:game:admin_reinjection_pad');
                let reinjectionPad = padStr ? parseFloat(padStr) : 0;
                const dynamicLimit = 33 + reinjectionPad; // Auto-scales beyond 80-100 NXS based on traffic
                const isHourlyCapped = hourlyNetLoss >= dynamicLimit;
                console.log(`[ENGINE] Stats: HourlyLoss=${hourlyNetLoss.toFixed(2)}, Pad=${reinjectionPad.toFixed(2)}, Limit=${dynamicLimit.toFixed(2)}, Capped=${isHourlyCapped}, PhaseA=${isPhaseA}`);

                let payoutSource = 'redis_pot';
                let auditPlayers = [];
                let actualHourlyLossDeduct = 0;
                let actualActiveDeduct = 0;
                let actualPadDeduct = 0;

                batch.sort((a, b) => b.betAmount - a.betAmount); // Whale first

                if (isMultiplayer) {
                    // TRIANGULAR BALANCE (85% to ONE winner, others get 0 money but near miss UI)
                    const winnerIdx = Math.floor(Math.random() * batch.length); // Pick 1 random winner
                    const winnerPayout = parseFloat((totalBet * 0.85).toFixed(2));
                    
                    for (let i = 0; i < batch.length; i++) {
                        const p = batch[i];
                        let rtpMult = 0.0; let label = 'LOSS'; let rank = 8;
                        let targetPayout = 0;
                        
                        if (i === winnerIdx) {
                            targetPayout = winnerPayout;
                            rtpMult = targetPayout / p.betAmount;
                            if (rtpMult >= 3.0) { label = 'MEGA_WIN'; rank=1; }
                            else if (rtpMult >= 1.5) { label = 'PROFIT'; rank=2; }
                            else { label = 'REFUND'; rank=3; }
                        } else {
                            targetPayout = 0; // The losers pay. 
                            if (Math.random() > 0.4) { rtpMult = 0.8; label = 'NEAR_MISS'; rank=3; } // Visual UI near miss
                            else { rtpMult = 0.0; label = 'LOSS'; rank=8; }
                        }

                        actualActiveDeduct += targetPayout;
                        // Note: For multiplayer, the pot handles the winner, others pay.
                        // We don't deduct winners from redisLivePot here because it's handled below globally.

                        let safeLabel = label.replace('_', ' ');
                        p.finalOutcome = {
                            winAmount: targetPayout,
                            isWin: targetPayout > 0,
                            label: label,
                            rank: rank,
                            mode: 'triangular_p2p',
                            sliceIndex: rtpMult === 0.0 ? 4 : (rtpMult >= 2 ? 0 : 6) // Visual mapped
                        };
                        
                        console.log(`[ENGINE] P2P Player ${p.userId}: Bet=${p.betAmount}, Win=${targetPayout}, Slice=${p.finalOutcome.sliceIndex}`);
                        auditPlayers.push({ userId: p.userId, betAmount: p.betAmount, winAmount: targetPayout });
                    }
                } else {
                    // SINGLE PLAYER: 3-3 Silent Pulse
                    for (let i = 0; i < batch.length; i++) {
                        const p = batch[i];
                        let rtpMult = 0.0; let label = 'LOSS'; let rank = 8;
                        const isGold = p.betAmount >= 30;
                        const isSilver = p.betAmount >= 15 && p.betAmount < 30;
                        let targetPayout = 0;

                        if (isPhaseA && !isHourlyCapped) {
                             if (isGold) rtpMult = 1.5;
                             else if (isSilver) rtpMult = Math.random() < 0.5 ? 1.5 : 2.0;
                             else rtpMult = Math.random() < 0.5 ? 2.0 : 3.0; // Bronze
                             
                             targetPayout = parseFloat((p.betAmount * rtpMult).toFixed(2));
                             
                             const netLoss = parseFloat((targetPayout - p.betAmount).toFixed(2));
                             
                             if (netLoss > 0 && reinjectionPad >= netLoss) {
                                 // Safely take from Pad!
                                 actualPadDeduct += netLoss;
                                 reinjectionPad -= netLoss;
                                 actualActiveDeduct += p.betAmount;
                                 payoutSource = 'admin_pad_injection';
                                 if(rtpMult>=3) { label='JACKPOT'; rank=1;}
                                 else { label='PROFIT'; rank=2; }
                             } else {
                                 // Pad empty! Save players with probabilistic refunds to prevent economy drain
                                 // HIGH REFUND FOR SILVER/GOLD (80%)
                                 if (isGold && Math.random() < 0.9) { 
                                     rtpMult = 1.0; label = 'REFUND'; rank=3; targetPayout=p.betAmount; 
                                 } else if (isSilver && Math.random() < 0.8) {
                                     rtpMult = 1.0; label = 'REFUND'; rank=3; targetPayout=p.betAmount; 
                                 } else { 
                                     rtpMult = 0.0; label = 'MISS'; rank=8; targetPayout=0; 
                                 }
                             }
                        } else {
                             // Phase B (Recovery / Safe Mode)
                             // Stop invincibility spam: Protect Gold frequently (70% chance), but not 100%. Protect Silver slightly.
                             if (isGold && Math.random() < 0.7) { 
                                 rtpMult = 1.0; label = 'REFUND'; rank=3; targetPayout=p.betAmount; 
                             } else if (isSilver && Math.random() < 0.3) {
                                 rtpMult = 1.0; label = 'REFUND'; rank=3; targetPayout=p.betAmount; 
                             } else { 
                                 rtpMult = 0.8; label = 'NEAR_MISS'; rank=3; targetPayout=0; 
                             }
                        }

                        if (actualPadDeduct === 0) {
                             const netL = parseFloat((targetPayout - p.betAmount).toFixed(2));
                             if (netL > 0) actualHourlyLossDeduct += netL;
                             actualActiveDeduct += targetPayout;
                             // We don't sub redisLivePot here manually, handled by incrByFloat below globally
                        }

                        let safeLabel = label.replace('_', ' ');
                        p.finalOutcome = {
                            winAmount: parseFloat(targetPayout.toFixed(2)),
                            isWin: targetPayout > 0,
                            label: safeLabel, 
                            rank: rank,
                            mode: isPhaseA ? 'pulse_active' : 'pulse_recovery',
                            sliceIndex: this.getVisualSliceIndex(p.tier, targetPayout, p.gameType)
                        };
                        
                        console.log(`[ENGINE] SinglePlayer ${p.userId}: Bet=${p.betAmount}, Win=${targetPayout}, PadUsed=${actualPadDeduct > 0}, Slice=${p.finalOutcome.sliceIndex} (${p.tier})`);
                        auditPlayers.push({ userId: p.userId, betAmount: p.betAmount, winAmount: targetPayout });
                    }
                }

                if (actualActiveDeduct > 0) {
                    await RedisService.client.incrByFloat('livedata:game:match_pot', -actualActiveDeduct);
                }
                if (actualPadDeduct > 0) {
                    await RedisService.client.incrByFloat('livedata:game:admin_reinjection_pad', -actualPadDeduct);
                }
                if (actualHourlyLossDeduct > 0) {
                    await RedisService.client.incrByFloat(hourlyKey, actualHourlyLossDeduct);
                    await RedisService.client.expire(hourlyKey, 3600);
                }

                // Batch to Mongo 
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.adminIncome': adminIncomeIn,
                        'stats.totalBetsIn': totalBet,
                        'stats.totalPayoutsOut': parseFloat((actualActiveDeduct + actualPadDeduct).toFixed(2)),
                        'stats.totalGamesPlayed': batch.length
                    }
                });

                await P2PAudit.create({
                    gameType: 'GLOBAL_BATCH',
                    players: auditPlayers,
                    financials: {
                        totalBetIn: totalBet,
                        redisPotContribution: activePoolIn,
                        totalPayoutOut: actualActiveDeduct + actualPadDeduct,
                        payoutSource
                    },
                    redisPotState: { before: redisPotBefore, after: redisLivePot }
                });

                for (let p of batch) {
                    p.resolve(p.finalOutcome);
                }
            }
        } finally { q.isProcessing = false; }
    }
    getVisualSliceIndex(tier, winAmount, gameType) {
        if (gameType !== 'spin') return 4; // Not a wheel game

        // Handle rounding for 1.5x cases (e.g. 7.5 -> 8, 22.5 -> 22) to match harmonized labels
        let amount = Math.round(winAmount);
        if (tier === 'silver' && amount === 23) amount = 22; // Hard sync for Silver 1.5x
        if (tier === 'bronze' && amount === 7) amount = 8;   // Hard sync for Bronze 1.5x

        // Dynamic Mapping based on LuckTestClient.js Slices [Jackpot, 2x, 1.5x, 1.2x, 1x, 0.8x, 0.4x, 0x]
        const mapping = {
            bronze: {
                25: 0, 10: 1, 8: 2, 6: 3, 5: 4, 4: 5, 2: 6, 0: 7
            },
            silver: {
                75: 0, 30: 1, 22: 2, 18: 3, 15: 4, 12: 5, 6: 6, 0: 7
            },
            gold: {
                150: 0, 60:1, 45: 2, 36: 3, 30: 4, 24: 5, 12: 6, 0: 7
            }
        };

        const tierMap = mapping[tier] || mapping.bronze;
        
        // Find exact match or default to a "close" slice for safety
        if (tierMap[amount] !== undefined) return tierMap[amount];
        
        if (amount === 0) return 7;
        if (amount > 5) return 0; // High wins default to jackpot slice if mismatch
        return 7; // Default to loss
    }
}

module.exports = new UniversalMatchMaker();
