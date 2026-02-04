const { client } = require('../../config/redis');
const ss = require('simple-statistics');

class IntelligenceController {

    constructor() {
        // KEYS
        this.POOL_GLOBAL = 'wallet:global_prize_pool';
        this.POOL_MICRO = 'pool:class_b'; // Micro-Bettor Pool
        this.HOUSE_RESERVE = 'wallet:house_reserve';
        this.ACTIVE_USERS = 'server:active_users';
        this.PAYOUT_HISTORY = 'intelligence:payout_history:10m'; // List of payouts timestamps
    }

    async processBet(userId, betAmount) {
        if (!client.isOpen) throw new Error("Redis Down");

        const userClass = await this._classifyUser(userId, betAmount);

        // 1. DYNAMIC HOUSE EDGE (Deduct Commission BEFORE Pool Entry)
        // 8% / 10% / 15%
        const activeUsers = parseInt(await client.get(this.ACTIVE_USERS) || '0');
        let edge = 0.08;
        if (activeUsers >= 100) edge = 0.10;
        if (activeUsers >= 300) edge = 0.15;

        const commission = betAmount * edge;
        const netPoolEntry = betAmount - commission;

        // Distribute Commission
        await this._distributeCommission(commission);

        // 2. POOL ALLOCATION
        // Class B (Micro) -> Goes to Micro Pool
        // Class A (Whale) -> Goes to Global, but funded by Micro Pool on wins
        if (userClass === 'B') {
            await client.incrByFloat(this.POOL_MICRO, netPoolEntry);
        } else {
            await client.incrByFloat(this.POOL_GLOBAL, netPoolEntry);
        }

        return { userClass };
    }

    /**
     * MAIN DECISION POINT
     * @param {string} userId
     * @param {number} betAmount
     * @param {string} gameType ('aviator' | 'super_ace')
     */
    async decideOutcome(userId, betAmount, gameType) {
        if (!client.isOpen) {
            // [FALLBACK] Redis Down -> Default to Random Loss/Small Win (Safe Mode)
            return {
                targetMultiplier: Math.random() < 0.1 ? 1.5 : 0, // 10% chance of small win without intelligence
                win: 0, // Calculated later if targetMultiplier > 0
                tax: 0,
                flags: ['REDIS_DOWN_FALLBACK'],
                userClass: 'C'
            };
        }

        const now = Date.now();

        // Process Bet (Financial Routing)
        // Note: For Super Ace, Outcome decision happens instantly after bet.
        // So we call processBet here.
        const { userClass } = await this.processBet(userId, betAmount);

        // 3. TARGET GENERATION
        let targetMultiplier = 0;
        let p2pSource = 'GLOBAL';
        let flags = [];
        let win = 0;

        // --- STRATEGY ---
        if (userClass === 'C') {
            // NEWBIE: Welcome Luck (2x Win)
            // Check Liquidity
            const safe = await this._checkLiquidity(betAmount * 2);
            if (safe) {
                targetMultiplier = 2.0;
                flags.push('WELCOME_LUCK');
            } else {
                targetMultiplier = 0.5; // Loss if no funds
            }

        } else if (userClass === 'A') {
            // WHALE: High Risk. 
            // Funding: 30% of Class B Pool available?
            const microPool = parseFloat(await client.get(this.POOL_MICRO) || '0');
            const whaleBudget = microPool * 0.30;

            // "Near Miss" Strategy primarily
            // 70% chance of Loss/NearMiss. 30% Chance of Win IF budget exists.
            const luck = Math.random();
            if (luck < 0.30 && whaleBudget > betAmount * 1.5) {
                // WIN
                targetMultiplier = 1.5 + (Math.random() * 2.0); // 1.5x - 3.5x
                p2pSource = 'POOL_MICRO'; // Funded by Micro
                flags.push('WHALE_FEED');
            } else {
                // LOSS or NEAR MISS
                if (Math.random() < 0.5) flags.push('NEAR_MISS');
                targetMultiplier = 0; // Loss
            }

        } else {
            // MICRO (Class B): Retention
            // High Freq (40% Win Rate), Low Value (1.2x - 1.8x)
            const luck = Math.random();
            if (luck < 0.40) {
                const safe = await this._checkLiquidity(betAmount * 1.5);
                if (safe) {
                    targetMultiplier = 1.1 + (Math.random() * 0.8);
                    flags.push('RETENTION_CHIP');
                }
            } else {
                if (Math.random() < 0.3) flags.push('NEAR_MISS'); // Tease
            }
        }

        // 4. RATE LIMITER (85% Cap) check happened in _checkLiquidity basically? 
        // We need stricter check on OUTFLOW.
        win = betAmount * targetMultiplier;
        if (win > 0) {
            const flowCheck = await this._checkFlowControl(win);
            if (!flowCheck) {
                targetMultiplier = 0;
                win = 0;
                flags = ['FLOW_CAP_STOP'];
            }
        }

        // 5. TAXATION
        // Win > 1000 -> 5% Tax to House Reserve
        let tax = 0;
        if (win > 1000) {
            tax = win * 0.05;
            win -= tax;
            await client.incrByFloat(this.HOUSE_RESERVE, tax);

            // [POOL ISOLATION] Tax goes STRICTLY to House Reserve. 
            // Previous logic of reinvesting to Micro-Pool removed to ensure clear separation.

            flags.push('TAX_COLLECTED');
        }

        // 6. RECORD PAYOUT (If win)
        if (win > 0) {
            await client.lPush(this.PAYOUT_HISTORY, `${Date.now()}:${win}`);
            // Source Deduction
            if (p2pSource === 'POOL_MICRO') {
                await client.incrByFloat(this.POOL_MICRO, -(win + tax)); // Deduct gross from source
            } else {
                await client.incrByFloat(this.POOL_GLOBAL, -(win + tax));
            }
        }

        // AUDIT LOG
        // Format: [INTELLIGENCE] User: {id} | Class: {A/B/C} | Decision: {Multiplier} | Funding: {P2P_Source} | Tax: {Amount}
        const logMsg = `[INTELLIGENCE] User: ${userId} | Class: ${userClass} | Decision: ${targetMultiplier.toFixed(2)}x | Funding: ${p2pSource} | Tax: ${tax.toFixed(2)} | Flags: ${flags.join(',')}\n`;
        console.log(logMsg.trim());

        // [ZERO-LEAK PROTOCOL] Persistent Log
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../dev_monitor.txt');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${logMsg}`);
        } catch (err) {
            console.error("Log Write Failed:", err.message);
        }

        return {
            targetMultiplier,
            win,
            tax,
            flags,
            userClass
        };
    }

    // --- HELPERS ---

    async _classifyUser(userId, betAmount) {
        // Cache classification? For now, real-time.
        const spinCount = parseInt(await client.get(`user:spin_count:${userId}`) || '0');

        if (spinCount < 10) return 'C'; // Newbie
        if (betAmount > 500) return 'A'; // Whale
        return 'B'; // Micro
    }

    async _distributeCommission(amount) {
        const tech = amount * 0.30;
        const replay = amount * 0.30;
        const partner = amount * 0.40;
        await client.incrByFloat('wallet:tech', tech);
        await client.incrByFloat('wallet:replay', replay);
        await client.incrByFloat('wallet:partner', partner);
    }

    async _checkLiquidity(amount) {
        const pool = parseFloat(await client.get(this.POOL_GLOBAL) || '0');
        return pool >= amount;
    }

    async _checkFlowControl(winAmount) {
        // 85% of Current Pool Payout Cap in 10 mins?
        // Let's simplified: Total Payouts in last 10m + Current Win <= 85% of Pool

        const now = Date.now();
        const window = 10 * 60 * 1000;

        // Prune History
        let history = await client.lRange(this.PAYOUT_HISTORY, 0, -1);
        let recentPayouts = 0;
        let pruned = false;

        // This is heavy for high freq, but "simple-statistics" request implies math. 
        // We'll trust Redis speed.

        for (let entry of history) {
            const [ts, amt] = entry.split(':');
            if (now - parseInt(ts) < window) {
                recentPayouts += parseFloat(amt);
            } else {
                pruned = true; // Tail is old
            }
        }

        if (pruned) await client.lTrim(this.PAYOUT_HISTORY, 0, 999); // Keep last 1000 roughly or trim by time logic (async job better)

        const globalPool = parseFloat(await client.get(this.POOL_GLOBAL) || '0');
        const microPool = parseFloat(await client.get(this.POOL_MICRO) || '0');
        const totalLiquidity = globalPool + microPool;

        // Cap: 85% of Liquidity
        const cap = totalLiquidity * 0.85;

        if (recentPayouts + winAmount > cap) return false;

        // Additional: Win-Tax Logic handled in main flow
        return true;
    }
}

module.exports = new IntelligenceController();
