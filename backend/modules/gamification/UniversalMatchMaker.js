const SystemSetting = require('../settings/SystemSettingModel');
const User = require('../user/UserModel');

/**
 * Universal MatchMaker Engine - V4 (High-Rolling & Retention Optimized)
 * Features: Rolling Trap, Jackpot Gating, and Dynamic Difficulty Scaling (DDS).
 */
class UniversalMatchMaker {
    constructor() {
        this.queues = {};
        this.DEFAULT_WINDOW_MS = 1500; 
        this.globalScratchPool = 50000; // Track historical liquidity to allow jackpots
        this.globalSpinPool = 0; // Strictly 0 so admin never loses. Accumulates from margins.
    }

    async processMatch(userId, betAmount, gameType = 'spin', customWindowMs = null) {
        return new Promise((resolve, reject) => {
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

    async triggerMatch(gameType) {
        const q = this.queues[gameType];
        if (!q || q.isProcessing) return;
        q.isProcessing = true;
        if (q.timeout) { clearTimeout(q.timeout); q.timeout = null; }

        try {
            while (q.players.length > 0) {
                // Batching: Duo Preferred, Solo fallback
                let batch = q.players.length >= 2 ? q.players.splice(0, 2) : q.players.splice(0, 1);
                const isDuo = batch.length === 2;
                
                const totalBet = batch.reduce((sum, p) => sum + p.betAmount, 0);
                const adminMargin = totalBet * 0.10; // Guaranteed 10% Profit
                const rewardPool = totalBet - adminMargin; 

                if (gameType === 'scratch') {
                    this.globalScratchPool += rewardPool;
                    this.executeScratchBatch(batch, isDuo);
                } else if (gameType === 'spin') {
                    this.globalSpinPool += rewardPool;
                    this.executeSpinBatch(batch, isDuo);
                }
            }
        } finally { q.isProcessing = false; }
    }

    /**
     * Optimized Scratch Engine: Distributes rewards with volatility while capping at 90% RTP.
     */
    executeScratchBatch(batch, isDuo) {
        if (!isDuo) {
            const p = batch[0];
            const outcome = this.calcWeightedMult(p.betAmount, this.globalScratchPool);
            this.globalScratchPool = Math.max(0, this.globalScratchPool - outcome.amount);
            p.resolve(this.generateOutcome(outcome.amount, outcome.label, outcome.rank, this.globalScratchPool));
            return;
        }

        // Duo Scratch: Solve for P1, then assign remaining to P2
        const p1 = batch[0];
        const p2 = batch[1];
        
        const o1 = this.calcWeightedMult(p1.betAmount, this.globalScratchPool);
        this.globalScratchPool = Math.max(0, this.globalScratchPool - o1.amount);
        
        const o2 = this.calcWeightedMult(p2.betAmount, this.globalScratchPool);
        this.globalScratchPool = Math.max(0, this.globalScratchPool - o2.amount);

        p1.resolve(this.generateOutcome(o1.amount, o1.label, o1.rank, this.globalScratchPool));
        p2.resolve(this.generateOutcome(o2.amount, o2.label, o2.rank, this.globalScratchPool));
    }

    calcWeightedMult(bet, pool) {
        const rng = Math.random() * 100;
        let mult = 0;
        let label = 'LOSS';
        let rank = 8;

        if (rng < 1) { mult = 10.0; label = 'LEGENDARY'; rank = 1; }
        else if (rng < 5) { mult = 5.0; label = 'EPIC'; rank = 1; }
        else if (rng < 15) { mult = 2.0; label = 'PROFIT'; rank = 2; }
        else if (rng < 35) { mult = 1.0; label = 'REFUND'; rank = 2; }
        else if (rng < 55) { 
            if (bet === 50) mult = 0.3; // Consolation 15
            else if (bet === 100) mult = 0.25; // Consolation 25
            else mult = 0.5; // Default Consolation 0.5x
            label = 'CONSOLATION'; rank = 3; 
        }
        else { mult = 0.0; label = 'LOSS'; rank = 8; }

        // Mandatory Cap: A single payout cannot exceed the entire reward pool of the batch
        let amount = Math.min(bet * mult, pool);
        
        // Adjust label if capped significantly
        if (amount < bet * mult && amount > 0) label = 'MEGA WIN (CAPPED)';

        return { amount, label, rank };
    }

    /**
     * Optimized Spin Engine: Strict Zero-Liability. Admin never loses. Single Users don't bleed too fast.
     */
    executeSpinBatch(batch, isDuo) {
        if (!isDuo) {
            const p = batch[0];
            const bet = p.betAmount;
            
            // Expected Wheel Multipliers: 5.0, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0
            const rng = Math.random() * 100;
            let mult = 0.0;
            
            if (rng < 1) mult = 5.0;           // 1%
            else if (rng < 5) mult = 3.0;      // 4%
            else if (rng < 10) mult = 2.5;     // 5%
            else if (rng < 20) mult = 2.0;     // 10%
            else if (rng < 40) mult = 1.5;     // 20%
            else if (rng < 65) mult = 1.0;     // 25% (Extends playtime)
            else if (rng < 90) mult = 0.5;     // 25% (Extends playtime)
            else mult = 0.0;                   // 10%
            
            let payout = parseFloat((bet * mult).toFixed(2));
            
            // [STRICT] Admin Never Loses. Cap payout if globalSpinPool is insufficient.
            if (payout > this.globalSpinPool) {
                const possibleMults = [5.0, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0];
                for (let pm of possibleMults) {
                    if (pm * bet <= this.globalSpinPool) {
                        mult = pm;
                        payout = parseFloat((bet * mult).toFixed(2));
                        break;
                    }
                }
            }
            
            this.globalSpinPool = Math.max(0, this.globalSpinPool - payout);
            p.resolve(this.generateOutcome(payout, mult > 0 ? 'WIN' : 'LOSS', 1, this.globalSpinPool));
        } else {
            // Duo Spin logic: one wins 1.8x, other loses, or split.
            const p1 = batch[0], p2 = batch[1];
            const winnerIdx = Math.random() > 0.5 ? 0 : 1;
            const loserIdx = winnerIdx === 0 ? 1 : 0;
            
            p1.resolve(this.generateOutcome(p1.betAmount * 1.8, 'WIN', 1, this.globalSpinPool));
            p2.resolve(this.generateOutcome(0, 'LOSS', 8, this.globalSpinPool));
        }
    }


    generateOutcome(winAmount, label, rank, pool) {
        return {
            winAmount: parseFloat(winAmount.toFixed(2)),
            isWin: winAmount > 0,
            label,
            rank,
            mode: 'p2p-hybrid',
            pool: parseFloat(pool.toFixed(2))
        };
    }


}

module.exports = new UniversalMatchMaker();
