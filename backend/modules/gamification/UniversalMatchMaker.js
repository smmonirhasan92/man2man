const GameVault = require('./GameVaultModel');
const RedisService = require('../../services/RedisService');
const P2PAudit = require('./P2PAuditModel');
const SocketService = require('../common/SocketService');

const UNIVERSAL_MULTIPLIERS = [5, 3.3, 2.6, 2, 1.5, 1, 0.5, 0];

class UniversalMatchMaker {
    constructor() {
        this.globalQueue = { players: [], timeout: null, isProcessing: false };
        this.DEFAULT_WINDOW_MS = 1000; // 1s Pulse: Zero-lag feeling
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

    async processMatch(userId, betAmount, gameType = 'spin', tier = 'bronze', customWindowMs = null, consecutiveLosses = 0) {
        return new Promise(async (resolve, reject) => {
            const config = await this.getDynamicConfig();
            if (!config.isEnabled) {
                return reject(new Error('Game engine is currently disabled by admin (Kill Switch).'));
            }

            const q = this.globalQueue;
            q.players.push({ userId, betAmount, gameType, tier, consecutiveLosses, resolve, reject, timestamp: Date.now() });
            
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

                try {
                    const vault = await GameVault.getMasterVault();
                    const config = vault.config;
                    
                    // [PERSISTENCE FIX] If Redis is empty but Mongo has Seed, RESTORE it!
                    let redisLivePotStr = await RedisService.get('livedata:game:match_pot');
                    let redisLivePot = redisLivePotStr ? parseFloat(redisLivePotStr) : null;
                    
                    if (redisLivePot === null || redisLivePot < 100) {
                         if (vault.balances.activePool > 5000) {
                             console.warn(`[RECOVERY] Redis Pot Lost! Restoring ${vault.balances.activePool} NXS from MongoDB.`);
                             await RedisService.client.set('livedata:game:match_pot', vault.balances.activePool.toString());
                             redisLivePot = vault.balances.activePool;
                         } else { redisLivePot = redisLivePot || 0; }
                    }
                
                const currentMinute = new Date().getMinutes();
                const isPhaseA = currentMinute % 6 < 3; // 0-2 (Win Mode), 3-5 (Recovery)

                const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);

                // [ADAPTIVE] TARGET SEED MANAGEMENT
                const TARGET_SEED = 17500;
                const isHighVolume = batch.length >= 5;
                const isHealthyPool = redisLivePot >= TARGET_SEED;
                const isAbundance = redisLivePot >= 15000;
                
                // Adaptive Fee & Pool Contribution
                let houseEdgePct = isMultiplayer ? 0.15 : (config.houseEdge / 100);
                
                if (isAbundance) {
                    houseEdgePct = 0; // "Promotion Mode": No fees when pool is big
                    console.log(`[ADAPTIVE] ABUNDANCE MODE: ${redisLivePot.toFixed(2)} NXS. Fees set to 0% for this batch.`);
                } else if (isMultiplayer) {
                    houseEdgePct = 0.15; // [FIX] P2P always 15% — 7.5% Admin + 7.5% → Bonus PAD
                    console.log(`[P2P] Multiplayer batch. Fee=15% (7.5% to PAD).`);
                }

                const totalFeeIn = parseFloat((totalBet * houseEdgePct).toFixed(2)); 
                const adminIncomeIn = parseFloat((totalFeeIn * 0.25).toFixed(2)); // [FIX] 25% Admin share
                const reinjectionPadIn = parseFloat((totalFeeIn - adminIncomeIn).toFixed(2)); // [FIX] 75% PAD share for fast Jackpots                
                if (reinjectionPadIn > 0) {
                    await RedisService.client.incrByFloat('livedata:game:admin_reinjection_pad', reinjectionPadIn);
                }
                
                // Active Pool Logic: ALL Bets (minus fees) contribute to the pool for reliable redistribution
                const activePoolIn = parseFloat((totalBet - totalFeeIn).toFixed(2)); 

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
                const isHourlyCapped = (hourlyNetLoss >= dynamicLimit); // [FIX] Abundance shouldn't bypass caps completely if we are bleeding money!
                const activePhaseA = isAbundance ? true : isPhaseA; 

                console.log(`[ENGINE] Stats: HourlyLoss=${hourlyNetLoss.toFixed(2)}, Pad=${reinjectionPad.toFixed(2)}, Limit=${dynamicLimit.toFixed(2)}, Capped=${isHourlyCapped}, PhaseA=${activePhaseA}`);

                let payoutSource = 'redis_pot';
                let auditPlayers = [];
                let actualHourlyLossDeduct = 0;
                let actualActiveDeduct = 0;
                let actualPadDeduct = 0;

                batch.sort((a, b) => a.timestamp - b.timestamp); // [FIX] Preserving First-Click Order (Ascending)

                if (isMultiplayer) {
                    // [FIX] FAIR-BIAS SELECTION: First person in batch gets 65% weight
                    const rollMain = Math.random();
                    const mainWinnerIdx = (rollMain < 0.65) ? 0 : Math.floor(Math.random() * (batch.length - 1)) + 1;

                    let sideWinnerIdx = -1;
                    if (batch.length >= 3) {
                        sideWinnerIdx = (mainWinnerIdx + 1) % batch.length;
                    }

                    // [SPEED LOOP] P2P JACKPOT: If PAD is high, inject it into the P2P main winner!
                    let bonusFromPad = 0;
                    if (reinjectionPad > 50) {
                        bonusFromPad = Math.min(reinjectionPad * 0.5, 60); // Inject 50% of PAD (max 60 NXS)
                        reinjectionPad -= bonusFromPad;
                        actualPadDeduct += bonusFromPad;
                        payoutSource = 'p2p_with_pad_injection';
                    }

                    const jitter = 0.85 + (Math.random() * 0.10); // 85-95% payout jitter
                    const totalPotForPrizes = parseFloat(((activePoolIn + bonusFromPad) * jitter).toFixed(2));
                    
                    for (let i = 0; i < batch.length; i++) {
                        const p = batch[i];
                        let targetPayout = 0;
                        let label = 'LOSS'; let rank = 8;
                        
                        if (i === mainWinnerIdx) {
                            targetPayout = isAbundance ? totalBet : (totalPotForPrizes * 0.85); // 85% of prizes
                        } else if (i === sideWinnerIdx) {
                            targetPayout = (totalPotForPrizes * 0.15); // 15% side winner
                        }
                        
                        targetPayout = parseFloat(targetPayout.toFixed(2));
                        const rtpMult = targetPayout / (p.betAmount || 5);

                        if (rtpMult >= 3.0) { label = 'JACKPOT'; rank=1; }
                        else if (rtpMult >= 2.0) { label = 'PROFIT'; rank=2; }
                        else if (rtpMult >= 1.0) { label = 'REFUND'; rank=3; }
                        else if (rtpMult > 0) { label = 'NEAR_MISS'; rank=3; }

                        actualActiveDeduct += targetPayout;
                        // Note: For multiplayer, the pot handles the winner, others pay.
                        // We don't deduct winners from redisLivePot here because it's handled below globally.

                        let safeLabel = label.replace('_', ' ');
                        const visualSync = this.getVisualSliceIndex(p.tier, targetPayout, p.gameType, p.betAmount);

                        p.finalOutcome = {
                            winAmount: parseFloat(targetPayout.toFixed(2)),
                            isWin: targetPayout > 0,
                            label: safeLabel, 
                            rank: rank,
                            mode: 'p2p',
                            sliceIndex: visualSync.index
                        };
                        
                        console.log(`[ENGINE] P2P ${p.userId}: Bet=${p.betAmount}, Win=${targetPayout}, Mode=p2p`);
                        auditPlayers.push({ userId: p.userId, betAmount: p.betAmount, winAmount: targetPayout });
                    }
                } else {
                    // SINGLE PLAYER: Balanced Random Mode
                    for (let i = 0; i < batch.length; i++) {
                        const p = batch[i];
                        let rtpMult = 0.0; let label = 'MISS'; let rank = 8;
                        const isGold   = p.betAmount >= 9;
                        const isSilver = p.betAmount >= 6 && p.betAmount < 9;
                        let targetPayout = 0;

                        // [CORE FIX] Pool funds single-player wins directly.
                        // Pool (5512 NXS) is the payout reservoir — not PAD.
                        // PAD is only used for JACKPOT bonuses extra above normal wins.
                        // House edge (10%) ensures pool grows over time despite payouts.
                        const poolCapacity = redisLivePot; // Use actual pool for safety check
                        const canAffordWin = poolCapacity > (p.betAmount * 3); // Pool must have at least 3x bet

                        if (activePhaseA && !isHourlyCapped) {
                            // === PHASE A: Win Mode ===
                            const roll = Math.random();
                            // [SPEED LOOP] If PAD fund is overflowing, increase win chance significantly!
                            let winChance = isAbundance ? 0.70 : 0.35; 
                            if (reinjectionPad > 50) winChance = 0.60;

                            if (roll < winChance && canAffordWin) {
                                // Weighted multiplier selection based on tier
                                const rollWin = Math.random();
                                if (isAbundance) {
                                    if (rollWin < 0.15) rtpMult = 5.0;
                                    else if (rollWin < 0.30) rtpMult = 3.3;
                                    else if (rollWin < 0.50) rtpMult = 2.6;
                                    else if (rollWin < 0.70) rtpMult = 2.0;
                                    else if (rollWin < 0.88) rtpMult = 1.5;
                                    else rtpMult = 1.0;
                                } else if (isGold) {
                                    // Gold: Conservative — 1.5x mostly
                                    rtpMult = rollWin < 0.70 ? 1.5 : 2.0;
                                } else if (isSilver) {
                                    // Silver: Moderate variation
                                    if (rollWin < 0.40) rtpMult = 1.5;
                                    else if (rollWin < 0.75) rtpMult = 2.0;
                                    else rtpMult = 2.6;
                                } else {
                                    // Bronze: Full range possible
                                    if (rollWin < 0.30) rtpMult = 1.5;
                                    else if (rollWin < 0.55) rtpMult = 2.0;
                                    else if (rollWin < 0.75) rtpMult = 2.6;
                                    else if (rollWin < 0.90) rtpMult = 3.3;
                                    else rtpMult = 5.0;
                                }

                                targetPayout = parseFloat((p.betAmount * rtpMult).toFixed(2));
                                const netLoss = parseFloat((targetPayout - p.betAmount).toFixed(2));

                                // PAD used only for JACKPOT bonus top-up
                                if (netLoss > 0 && reinjectionPad >= netLoss && rtpMult >= 3) {
                                    actualPadDeduct += netLoss;
                                    reinjectionPad -= netLoss;
                                    payoutSource = 'admin_pad_injection';
                                } else {
                                    // [CORE FIX] Normal wins paid from main pool 
                                    actualActiveDeduct += netLoss;
                                    payoutSource = 'active_pool';
                                }
                                actualActiveDeduct += p.betAmount;
                                label = rtpMult >= 5.0 ? 'JACKPOT' : 'PROFIT';
                                rank = rtpMult >= 5.0 ? 1 : 2;

                            } else {
                                // 65% chance: Loss Path (Miss or Occasional Refund)
                                const streak = p.consecutiveLosses || 0;
                                const refundRoll = Math.random();
                                
                                // [FIX] Reduce arbitrary refunds to 20% to prevent over-inflating RTP. Only force refund early if heavily losing.
                                if (streak >= 4 || refundRoll < 0.20) {
                                    rtpMult = 1.0; label = 'REFUND'; rank = 3;
                                    targetPayout = p.betAmount;
                                    actualActiveDeduct += targetPayout;
                                    if (streak >= 4) console.log(`[RETENTION] ${p.userId} streak=${streak} → Force REFUND`);
                                } else {
                                    // 80% of losses = actual miss
                                    rtpMult = 0.0; label = 'MISS'; rank = 8; targetPayout = 0;
                                }
                            }

                        } else {
                            // === PHASE B: Recovery Mode (20% small win, 80% safe) ===
                            const roll = Math.random();
                            if (roll < 0.20 && canAffordWin) {
                                // 20% chance: Small win allowed even in recovery
                                rtpMult = 1.5; label = 'PROFIT'; rank = 2;
                                targetPayout = parseFloat((p.betAmount * rtpMult).toFixed(2));
                                actualActiveDeduct += targetPayout;
                            } else if (roll < 0.65) {
                                // 45%: Refund — player gets money back
                                rtpMult = 1.0; label = 'REFUND'; rank = 3;
                                targetPayout = p.betAmount;
                                actualActiveDeduct += targetPayout;
                            } else {
                                // 35%: Near Miss — 0.8x (partial return)
                                rtpMult = 0.8; label = 'NEAR MISS'; rank = 3;
                                targetPayout = parseFloat((p.betAmount * 0.8).toFixed(2)); // [FIX] Actually pay 0.8x, not 0
                                actualActiveDeduct += targetPayout;
                            }
                        }

                        // Hourly net loss tracking (only for true wins above bet)
                        const netL = parseFloat((targetPayout - p.betAmount).toFixed(2));
                        if (netL > 0 && actualPadDeduct === 0) {
                            actualHourlyLossDeduct += netL;
                        }
                        if (actualPadDeduct === 0 && targetPayout > 0 && label !== 'PROFIT') {
                            // Already counted above for win paths; this handles refund/nearmiss
                        }

                        const safeLabel = label;
                        // [BUDGET] Point 6: Cap payout at hardStopLimit — prevents single-hit pool drain
                        const hardStop = vault.config.hardStopLimit || 1000;
                        if (targetPayout > hardStop) { targetPayout = hardStop; }
                        const visualSync = this.getVisualSliceIndex(p.tier, targetPayout, p.gameType, p.betAmount);
                        targetPayout = visualSync.amount;

                        p.finalOutcome = {
                            winAmount: parseFloat(targetPayout.toFixed(2)),
                            isWin: targetPayout > p.betAmount,
                            label: safeLabel,
                            rank: rank,
                            mode: 'single',
                            sliceIndex: visualSync.index
                        };

                        console.log(`[ENGINE] Single ${p.userId}: Bet=${p.betAmount}, Win=${targetPayout} (${rtpMult}x), Phase=${activePhaseA?'A':'B'}`);
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

                // Batch to Mongo & Sync ActivePool
                await GameVault.updateOne({ vaultId: 'MASTER_VAULT' }, {
                    $inc: {
                        'balances.adminIncome': adminIncomeIn,
                        'balances.activePool': parseFloat((activePoolIn - actualActiveDeduct).toFixed(2)),
                        'stats.totalBetsIn': totalBet,
                        'stats.totalPayoutsOut': parseFloat((actualActiveDeduct + actualPadDeduct).toFixed(2)),
                        'stats.totalGamesPlayed': batch.length
                    }
                });

                // --- REAL-TIME ADMIN DASHBOARD SYNC (RECOVERED) ---
                try {
                    const updatedVault = await GameVault.getMasterVault();
                    
                    SocketService.broadcast('admin_dashboard', 'activity_feed', {
                        event: `Batch Processed (${batch.length} Players)`,
                        payout: (actualActiveDeduct + actualPadDeduct).toFixed(2),
                        timestamp: Date.now()
                    });
                    
                    SocketService.broadcast('admin_dashboard', 'vault_update', {
                        balances: updatedVault.balances,
                        stats: updatedVault.stats,
                        redisPot: parseFloat(redisLivePot.toFixed(2)) - actualActiveDeduct
                    });
                } catch (socketErr) {
                    console.warn(`[RECOVERY] Socket sync failed but engine is running:`, socketErr.message);
                }
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
                    if (p.finalOutcome) {
                        p.resolve(p.finalOutcome);
                    } else {
                        p.reject(new Error("Match processed but no outcome generated."));
                    }
                }
            } catch (batchError) {
                console.error(`[ENGINE] BATCH CRITICAL ERROR:`, batchError);
                for (let p of batch) {
                    p.reject(new Error("Engine internal error during match processing."));
                }
            }
        }
    } catch (globalError) {
        console.error(`[ENGINE] GLOBAL ENGINE ERROR:`, globalError);
    } finally { 
        q.isProcessing = false; 
        
        // [CRITICAL FIX] If players joined while this batch was processing, the timeout 
        // may have been missed or skipped. We MUST re-trigger immediately!
        if (q.players.length > 0) {
            console.log(`[ENGINE] Queue has ${q.players.length} stranded players. Re-triggering...`);
            q.timeout = setTimeout(() => this.triggerMatch(), 500); // 500ms safety pulse
        } else {
            q.timeout = null; // Clean up dead timeout IDs
        }
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
