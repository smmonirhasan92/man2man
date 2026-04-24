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
        const q = this.globalQueue;
        if (!q || q.players.length === 0) return;
        
        // [FIX] Always clear timeout immediately to prevent leaks during processing
        if (q.timeout) { clearTimeout(q.timeout); q.timeout = null; }

        if (q.isProcessing) return;
        q.isProcessing = true;

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
                
                // [THE PULSE ENGINE] HIGH-FREQUENCY JACKPOT MODEL
                // Admin Fixed at 3% (Sacred). Remaining 12% shared by Community.
                const adminIncomeIn = parseFloat((totalBet * 0.03).toFixed(2));    // Fixed 3.0% of Bet
                const megaFeeIn     = parseFloat((totalBet * 0.09).toFixed(2));    // Fixed 9.0% of Bet (Pulse Heartbeat)
                const bossFeeIn     = parseFloat((totalBet * 0.025).toFixed(2));   // Fixed 2.5% of Bet
                const bigBangFeeIn  = parseFloat((totalBet * 0.005).toFixed(2));   // Fixed 0.5% of Bet
                const reinjectionPadIn = 0; // [FIX] Zeroing Pad to maximize Jackpot frequency
                
                if (megaFeeIn > 0)    await RedisService.client.incrByFloat('livedata:game:fund_mega', megaFeeIn);
                if (bossFeeIn > 0)    await RedisService.client.incrByFloat('livedata:game:fund_boss', bossFeeIn);
                if (bigBangFeeIn > 0) await RedisService.client.incrByFloat('livedata:game:fund_bigbang', bigBangFeeIn);

                const totalDropIn = megaFeeIn + bossFeeIn + bigBangFeeIn;
                
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
                // [CURRENCY FIX] Base limit 500 NXS ($5) + Pad. 33 NXS was too low for 1:100 scale.
                const dynamicLimit = 500 + reinjectionPad; 
                const isHourlyCapped = (hourlyNetLoss >= dynamicLimit); 
                const activePhaseA = isAbundance ? true : isPhaseA; 

                console.log(`[ENGINE] Stats: HourlyLoss=${hourlyNetLoss.toFixed(2)}, Pad=${reinjectionPad.toFixed(2)}, Limit=${dynamicLimit.toFixed(2)}, Capped=${isHourlyCapped}, PhaseA=${activePhaseA}`);

                let payoutSource = 'redis_pot';
                let auditPlayers = [];
                let actualHourlyLossDeduct = 0;
                let actualActiveDeduct = 0;
                let actualPadDeduct = 0;
                let dropFundDeduct = 0;

                batch.sort((a, b) => a.timestamp - b.timestamp); // [FIX] Preserving First-Click Order (Ascending)

                if (isMultiplayer) {
                    // [NEW] SEPARATED FUND TRIGGER LOGIC
                    let fundMegaStr    = await RedisService.get('livedata:game:fund_mega');
                    let fundBossStr    = await RedisService.get('livedata:game:fund_boss');
                    let fundBigBangStr = await RedisService.get('livedata:game:fund_bigbang');

                    let currentMega    = fundMegaStr ? parseFloat(fundMegaStr) : 0;
                    let currentBoss    = fundBossStr ? parseFloat(fundBossStr) : 0;
                    let currentBigBang = fundBigBangStr ? parseFloat(fundBigBangStr) : 0;
                    
                    let lastBigBang = parseInt(await RedisService.get('livedata:game:last_bigbang')) || (Date.now() - 15 * 60000);
                    let lastBoss    = parseInt(await RedisService.get('livedata:game:last_boss')) || (Date.now() - 10 * 60000);
                    let lastMega    = parseInt(await RedisService.get('livedata:game:last_mega')) || (Date.now() - 5 * 60000);
                    
                    const now = Date.now();
                    let dropActivated = null;
                    
                    // [THE PULSE ENGINE] AGGRESSIVE JACKPOT THRESHOLDS (SCALED FOR 1:100)
                    // Priority 1: Big Bang (10 min / 1000 NXS threshold - $10)
                    if ((now - lastBigBang) > 10 * 60000 && currentBigBang >= 1000) {
                        dropActivated = { type: 'BIG_BANG', fundKey: 'livedata:game:fund_bigbang', amtConfig: { bronze: 300, silver: 500, gold: 800 } };
                        await RedisService.client.set('livedata:game:last_bigbang', now.toString());
                    } 
                    // Priority 2: Boss Win (3 min / 250 NXS threshold - $2.5)
                    else if ((now - lastBoss) > 3 * 60000 && currentBoss >= 250) {
                        dropActivated = { type: 'BOSS_WIN', fundKey: 'livedata:game:fund_boss', amtConfig: { bronze: 100, silver: 200, gold: 300 } };
                        await RedisService.client.set('livedata:game:last_boss', now.toString());
                    }
                    // Priority 3: Mega Win (Pulse) (1 min / 50 NXS threshold - $0.5)
                    else if ((now - lastMega) > 1 * 60000 && currentMega >= 50) {
                        dropActivated = { type: 'MEGA_WIN', fundKey: 'livedata:game:fund_mega', amtConfig: { bronze: 10, silver: 25, gold: 40 } };
                        await RedisService.client.set('livedata:game:last_mega', now.toString());
                    }

                    // [SMART PRIORITIZATION]
                    // If Big Bang or Boss Win is active, prefer Gold/Silver bettors in the batch.
                    let mainWinnerIdx = 0;
                    if (dropActivated) {
                        // Scan for Gold first, then Silver, then use first click [0]
                        const goldIdx = batch.findIndex(p => p.betAmount >= 9);
                        const silverIdx = batch.findIndex(p => p.betAmount >= 6);
                        
                        if (goldIdx !== -1) mainWinnerIdx = goldIdx;
                        else if (silverIdx !== -1) mainWinnerIdx = silverIdx;
                        else mainWinnerIdx = 0;

                        // [ZERO-LOSS PROTECTION] Check if chosen winner's prize can actually be afforded by ONE fund
                        const tierKey = batch[mainWinnerIdx].tier === 'silver' ? 'silver' : (batch[mainWinnerIdx].tier === 'gold' ? 'gold' : 'bronze');
                        const price = dropActivated.amtConfig[tierKey];
                        const fundInUse = dropActivated.fundKey === 'livedata:game:fund_bigbang' ? currentBigBang : (dropActivated.fundKey === 'livedata:game:fund_boss' ? currentBoss : currentMega);
                        
                        if (fundInUse < price) {
                            console.log(`[SAFE_GUARD] Fund ${dropActivated.fundKey} (${fundInUse}) insufficient for ${price}. Downscaling prize instead of skipping.`);
                            // Downgrade the prize tier if possible instead of nullifying
                            if (p.tier === 'gold' && fundInUse >= dropActivated.amtConfig.silver) {
                                // Keep Gold winner but give Silver prize
                                // targetPayout will be handled below
                            } else if (fundInUse >= dropActivated.amtConfig.bronze) {
                                // Keep winner but give Bronze prize
                            } else {
                                dropActivated = null;
                            }
                        }
                    } 
                    
                    // [FAIRNESS FIX] Pure Randomization - No 65% first-click bias
                    if (!dropActivated) {
                        mainWinnerIdx = Math.floor(Math.random() * batch.length);
                    }

                    let sideWinnerIdx = -1;
                    if (batch.length >= 3 && !dropActivated) {
                        sideWinnerIdx = (mainWinnerIdx + 1) % batch.length;
                    }

                    // [SPEED LOOP FIX] We apply pure multipliers. Do not inject Pad blindly as it breaks 5x max math.
                    let bonusFromPad = 0;
                    let usedPadForMainWinner = false;

                    const jitter = 0.85 + (Math.random() * 0.10); // 85-95% payout jitter
                    const basePotForPrizes = parseFloat((activePoolIn * jitter).toFixed(2));
                    
                    for (let i = 0; i < batch.length; i++) {
                        const p = batch[i];
                        let targetPayout = 0;
                        let label = 'LOSS'; let rank = 8;
                        
                        if (dropActivated && i === mainWinnerIdx) {
                            // FAST CLICK WINS THE COMMUNITY DROP (If affordability matches)
                            const tierKey = p.tier === 'silver' ? 'silver' : (p.tier === 'gold' ? 'gold' : 'bronze');
                            let price = dropActivated.amtConfig[tierKey];
                            
                            // [SMART FITTING] Use best affordable price
                            const fundInUse = dropActivated.fundKey === 'livedata:game:fund_bigbang' ? currentBigBang : (dropActivated.fundKey === 'livedata:game:fund_boss' ? currentBoss : currentMega);
                            if (fundInUse < price) {
                                if (fundInUse >= dropActivated.amtConfig.silver) price = dropActivated.amtConfig.silver;
                                else if (fundInUse >= dropActivated.amtConfig.bronze) price = dropActivated.amtConfig.bronze;
                            }

                            targetPayout = price;
                            payoutSource = 'community_drop_fund';
                            // Deduct from specific fund
                            await RedisService.client.incrByFloat(dropActivated.fundKey, -targetPayout);
                            dropFundDeduct = 0; // Already handled above per fund
                            label = dropActivated.type.replace('_', ' ');
                            rank = 1;

                        } else if (i === mainWinnerIdx) {
                            // [PULSE TUNING] Winner gets fixed multiplier (e.g. 1.7x for Bronze/Silver)
                            const mult = (p.betAmount >= 9) ? 1.8 : 1.7;
                            targetPayout = isAbundance ? totalBet : parseFloat((p.betAmount * mult).toFixed(2));
                            
                            // Boost with PAD if multiplier is low
                            if (reinjectionPad > 10 && (targetPayout / (p.betAmount || 5)) < 3.3) {
                                const requiredToBoost = (p.betAmount * 5.0) - targetPayout;
                                if (requiredToBoost > 0 && reinjectionPad >= requiredToBoost) {
                                    targetPayout += requiredToBoost;
                                    reinjectionPad -= requiredToBoost;
                                    actualPadDeduct += requiredToBoost;
                                    payoutSource = 'p2p_with_pad_injection';
                                    usedPadForMainWinner = true;
                                }
                            }

                            // [CRITICAL FIX] Target payout can NEVER exceed 5x the user's bet. Ensure bounds.
                            const maxAllowedPayout = p.betAmount * 5.0;
                            targetPayout = Math.min(targetPayout, maxAllowedPayout);
                            
                        } else if (i === sideWinnerIdx) {
                            targetPayout = (basePotForPrizes * 0.15); 
                            const maxAllowedPayout = p.betAmount * 2.6; // Side winner max 2.6x
                            targetPayout = Math.min(targetPayout, maxAllowedPayout);
                        }
                        
                        targetPayout = parseFloat(targetPayout.toFixed(2));
                        const rtpMult = targetPayout / (p.betAmount || 5);

                        // Uniform Jackpot definition (>3.0x is a jackpot)
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
                                // [NEW] Tiered Win Limit Protection
                                const hourPrefix = new Date().toISOString().slice(0, 13);
                                const userWinKey = `livedata:game:user_win_limit:${p.userId}:${hourPrefix}`;
                                const currentWinStr = await RedisService.get(userWinKey);
                                const currentWinTotal = currentWinStr ? parseFloat(currentWinStr) : 0;
                                
                                // Bronze: 200, Silver: 350, Gold: 500, Default: 400
                                const tierLimit = p.tier === 'bronze' ? 200 : p.tier === 'silver' ? 350 : p.tier === 'gold' ? 500 : 400;

                                if (currentWinTotal >= tierLimit) {
                                    rtpMult = 0.0; // User hit hourly profit ceiling
                                    console.log(`[CEILING] User ${p.userId} hit ${tierLimit} limit. Forcing MISS.`);
                                } else {
                                    // Weighted multiplier selection
                                    const rollWin = Math.random();
                                    if (isAbundance) {
                                        if (rollWin < 0.20) rtpMult = 2.6;
                                        else if (rollWin < 0.60) rtpMult = 2.0;
                                        else if (rollWin < 0.90) rtpMult = 1.5;
                                        else rtpMult = 1.0;
                                    } else {
                                        // [USER FIX] NO JACKPOTS in Single Mode! Max limit strictly 2.6x
                                        if (rollWin < 0.15) rtpMult = 2.6;        // 15% Max Cap at 2.6x
                                        else if (rollWin < 0.50) rtpMult = 2.0;   // 35% Double
                                        else rtpMult = 1.5;                       // 50% Base profit
                                    }

                                    // Track win toward limit
                                    const netProfit = (p.betAmount * rtpMult) - p.betAmount;
                                    if (netProfit > 0) {
                                        await RedisService.client.incrByFloat(userWinKey, netProfit);
                                        await RedisService.client.expire(userWinKey, 3600);
                                    }
                                }

                                targetPayout = parseFloat((p.betAmount * rtpMult).toFixed(2));
                                const netLoss = parseFloat((targetPayout - p.betAmount).toFixed(2));

                                // Single Mode gets NO PAD TOP-UP since Jackpots are disabled
                                actualActiveDeduct += netLoss;
                                payoutSource = 'active_pool';
                                
                                actualActiveDeduct += p.betAmount;
                                label = 'PROFIT'; // Uniform NO Jackpot naming for Single Mode
                                rank = 2;

                            } else {
                                // 65% chance: Loss Path (Miss or Occasional Refund)
                                const streak = p.consecutiveLosses || 0;
                                const refundRoll = Math.random();

                                // [FIX] Forced refund after 4 losses is now GUARANTEED
                                if (streak >= 4) {
                                    rtpMult = 1.0; label = 'REFUND'; rank = 3;
                                    targetPayout = p.betAmount;
                                    actualActiveDeduct += targetPayout;
                                    console.log(`[RETENTION] ${p.userId} streak=${streak} → GUARANTEED REFUND`);
                                } else if (refundRoll < 0.20) {
                                    rtpMult = 1.0; label = 'REFUND'; rank = 3;
                                    targetPayout = p.betAmount;
                                    actualActiveDeduct += targetPayout;
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
                // [Note] Drop fund deduction is now handled per-fund inside victory logic
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
                        event: `Batch: ${batch.map(p => p.username || 'User').join(', ')}`,
                        usernames: batch.map(p => p.username),
                        payout: (actualActiveDeduct + actualPadDeduct).toFixed(2),
                        timestamp: Date.now()
                    });
                    
                    const megaStr = await RedisService.get('livedata:game:fund_mega');
                    const bossStr = await RedisService.get('livedata:game:fund_boss');
                    const bibgStr = await RedisService.get('livedata:game:fund_bigbang');

                    SocketService.broadcast('admin_dashboard', 'vault_update', {
                        balances: updatedVault.balances,
                        stats: updatedVault.stats,
                        redisPot: parseFloat(redisLivePot.toFixed(2)) - actualActiveDeduct,
                        dropFunds: {
                            mega: parseFloat(megaStr) || 0,
                            boss: parseFloat(bossStr) || 0,
                            bigbang: parseFloat(bibgStr) || 0
                        }
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
