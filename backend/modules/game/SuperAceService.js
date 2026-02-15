const mongoose = require('mongoose');
const User = require('../user/UserModel');
const TransactionHelper = require('../common/TransactionHelper');
const ProfitGuard = require('./ProfitGuard'); // Use relaxed Guard

class SuperAceService {

    get SYMBOLS() {
        return ['J', 'Q', 'K', 'A', 'WILD', 'GOLD_J', 'GOLD_Q', 'GOLD_K', 'GOLD_A', 'SCATTER'];
    }

    async spin(userId, betAmount) {
        // [SPIN LOCK]
        let lockKey = `lock:spin:${userId}`;
        const { client } = require('../../config/redis');

        if (client && client.isOpen) {
            const isLocked = await client.set(lockKey, '1', { NX: true, EX: 3 });
            if (!isLocked) throw new Error("Spin in progress. Please wait.");
        }

        const self = this; // Capture context
        const TransactionLedger = require('../wallet/TransactionLedgerModel');

        try {
            return await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                if (!user) throw new Error("User not found");

                // 1. Validation & Deduction
                if (betAmount <= 0) throw new Error("Invalid Bet");

                // [FIX] Use GAME wallet for betting (Isolation)
                if ((user.wallet.game || 0) < betAmount) {
                    throw new Error("Insufficient Game Balance. Please Transfer Funds to Game Wallet.");
                }

                const balBeforeDeduct = user.wallet.game;
                user.wallet.game -= betAmount;
                const balAfterDeduct = user.wallet.game;

                // [LEDGER] Log Bet Deduction
                await TransactionLedger.create([{
                    userId,
                    type: 'debit',
                    amount: -betAmount,
                    fee: 0,
                    balanceBefore: balBeforeDeduct,
                    balanceAfter: balAfterDeduct,
                    description: 'Super Ace Bet',
                    transactionId: `BET_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    metadata: { game: 'super-ace', wallet: 'game' }
                }], { session });

                // 2. RNG Logic & Excitement Engine 🎰
                const { client } = require('../../config/redis');
                const streakKey = `streak:loss:${userId}`;
                let lossStreak = 0;

                if (client && client.isOpen) {
                    lossStreak = parseInt(await client.get(streakKey) || '0');
                }

                // [EXCITEMENT PARAMETERS]
                const PITY_THRESHOLD = 4; // After 4 losses, force a win
                const BASE_HIT_RATE = 0.48; // 48% Chance to hit something (increased from 45%)

                let isWin = Math.random() < BASE_HIT_RATE;
                let isPityWin = false;

                // [STREAK BREAKER] Force a small win if player is suffering
                if (lossStreak >= PITY_THRESHOLD) {
                    isWin = true;
                    isPityWin = true; // Flag to keep win small/safe
                    console.log(`[ACE_GAME] Pity Win Triggered for ${userId} (Streak: ${lossStreak})`);
                }

                let multiplier = 0;
                let grid = [];
                let totalWin = 0;

                // Determine Multiplier
                if (isWin) {
                    const rand = Math.random();

                    if (isPityWin) {
                        // Pity Win: 0.5x to 2.0x (Just to keep them happy)
                        multiplier = 0.5 + (Math.random() * 1.5);
                    } else {
                        // Normal Win Distribution
                        if (rand < 0.50) multiplier = 0.2 + (Math.random() * 0.7); // "Fake Win" (0.2x - 0.9x) - Feeds addiction safely
                        else if (rand < 0.80) multiplier = 1.1 + (Math.random() * 1.9); // Small Profit (1.1x - 3.0x)
                        else if (rand < 0.96) multiplier = 3.0 + (Math.random() * 7.0); // Big Win (3x - 10x)
                        else multiplier = 15.0 + (Math.random() * 35.0); // Mega Win
                    }

                    // Calculate Win
                    totalWin = parseFloat((betAmount * multiplier).toFixed(2));

                    // [SAFETY CHECK]
                    // If Pity Win or Small Win (< 3x), bypass strict ProfitGuard checks (Use Buffer)
                    // If Big Win, strictly enforce ProfitGuard
                    let isSafe = true;
                    if (multiplier > 3.0) {
                        isSafe = await ProfitGuard.enforceSafety(totalWin);
                    }
                    // Note: We skip ProfitGuard for small wins to ensure "Excitement" even in recovery mode.

                    if (isSafe) {
                        grid = self.generateWinningGrid(multiplier);
                        // Reset Loss Streak
                        if (client && client.isOpen) await client.set(streakKey, '0');
                    } else {
                        // Forced Loss due to Safety
                        totalWin = 0;
                        grid = self.generateLosingGrid();
                        if (client && client.isOpen) await client.incr(streakKey);
                    }
                } else {
                    // LOSS
                    totalWin = 0;
                    grid = self.generateLosingGrid();
                    if (client && client.isOpen) await client.incr(streakKey);
                }

                // 3. Payout
                if (totalWin > 0) {
                    const balBeforeWin = user.wallet.game;
                    user.wallet.game += totalWin;
                    const balAfterWin = user.wallet.game;

                    // [LEDGER] Log Win Credit
                    await TransactionLedger.create([{
                        userId,
                        type: 'credit',
                        amount: totalWin,
                        fee: 0,
                        balanceBefore: balBeforeWin,
                        balanceAfter: balAfterWin,
                        description: 'Super Ace Win',
                        transactionId: `WIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        metadata: { game: 'super-ace', multiplier: multiplier.toFixed(2), wallet: 'game', isPity: isPityWin }
                    }], { session });

                    console.log(`[ACE_GAME] User ${userId} Won ${totalWin} (Bet: ${betAmount, multiplier})`);
                }

                // Sync Legacy Field
                user.game_balance = user.wallet.game;

                // Save Updated User State
                await user.save({ session });

                // [SOCKET] Real-time Balance Update
                const SocketService = require('../../modules/common/SocketService');
                SocketService.broadcast(`user_${userId}`, `game_balance_update_${userId}`, user.wallet.game);
                SocketService.broadcast(`user_${userId}`, `balance_update`, user.wallet); // Send full wallet object

                return {
                    status: 'success',
                    balance: user.wallet.game, // The important one
                    wallet_balance: user.wallet.main,
                    grid: grid,
                    win: totalWin,
                    bet: betAmount,
                    streak: totalWin > 0 ? "WIN" : "LOSS",
                };
            });
        } finally {
            if (client && client.isOpen) await client.del(lockKey);
        }
    }

    // --- LOGIC HELPERS ---

    generateWinningGrid(targetMultiplier, bet) {
        // Create a grid with at least one match based on multiplier
        const grid = this.generateLosingGrid();

        // Basic 3-match
        grid[1][1] = 'K';
        grid[1][2] = 'K';
        grid[1][3] = 'K';

        // Add more based on multiplier
        if (targetMultiplier > 5) {
            grid[2][0] = 'WILD'; // Wild increases wins
            grid[2][1] = 'A';
            grid[2][2] = 'A';
            grid[2][3] = 'A';
        }

        return grid;
    }

    generateLosingGrid() {
        const syms = ['J', 'Q', 'K', 'A', 'S1', 'S2', 'S3'];
        const grid = [];
        for (let c = 0; c < 5; c++) {
            const col = [];
            for (let r = 0; r < 4; r++) {
                col.push(syms[Math.floor(Math.random() * syms.length)]);
            }
            grid.push(col);
        }
        return grid;
    }

    calculateMatches(grid) {
        const matches = [];
        // Simple Horizontal & Vertical Match Checker

        // Check Vertical Columns (Simplified logic)
        for (let c = 0; c < 5; c++) {
            for (let r = 0; r < 2; r++) { // limit loop to find 3
                let sym = this.getBaseSymbol(grid[c][r]);
                if (sym === this.getBaseSymbol(grid[c][r + 1]) && sym === this.getBaseSymbol(grid[c][r + 2])) {
                    matches.push({ c, r, len: 3, sym });
                }
            }
        }
        return matches;
    }

    getBaseSymbol(sym) {
        return sym ? sym.replace('GOLD_', '') : '';
    }

    calculateWinAmount(matches, bet) {
        if (!matches.length) return 0;
        // Simple payout: 0.5x bet per match set
        return matches.length * (bet * 0.5) * (matches[0].len || 1);
    }
}

module.exports = new SuperAceService();
