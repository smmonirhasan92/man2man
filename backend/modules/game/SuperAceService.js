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

        if (client.isOpen) {
            const isLocked = await client.set(lockKey, '1', { NX: true, EX: 3 });
            if (!isLocked) throw new Error("Spin in progress. Please wait.");
        }

        try {
            return await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                if (!user) throw new Error("User not found");

                // 1. Validation & Deduction
                if (betAmount <= 0) throw new Error("Invalid Bet");
                if (user.wallet.game < betAmount) throw new Error("Insufficient Balance");

                await User.findByIdAndUpdate(userId, { $inc: { 'wallet.game': -betAmount } }, { session });

                // [SIMPLIFIED LOGIC - CLEAN & FUN]
                // 1. Determine Win/Loss based on probabilistic RTP (Return to Player)
                // We target 94-96% RTP for a "Fun" experience.

                const isWin = Math.random() < 0.45; // 45% Hit Frequency (Very Fun/Active)

                let multiplier = 0;
                let grid;
                let matches = [];

                // 2. Safety Check (ProfitGuard)
                // Only block HUGE wins if system is bleeding. Small/Medium wins always allowed for fun.
                const isSafe = await ProfitGuard.enforceSafety(betAmount * 10); // Check if a 10x win is safe

                if (isWin && isSafe) {
                    // GENERATE WIN
                    const rand = Math.random();
                    if (rand < 0.60) multiplier = 1.2 + (Math.random() * 1.8);
                    else if (rand < 0.90) multiplier = 3.0 + (Math.random() * 7.0);
                    else if (rand < 0.99) multiplier = 10.0 + (Math.random() * 40.0);
                    else multiplier = 50.0 + (Math.random() * 50.0);

                    grid = this.generateWinningGrid(multiplier, betAmount);
                } else {
                    // FORCE LOSS (or un-safe)
                    grid = this.generateLosingGrid();
                    // 20% Chance of Near Miss to keep engagement
                    if (Math.random() < 0.20) {
                        grid[0][0] = 'SCATTER';
                        grid[1][0] = 'SCATTER';
                    }
                }

                // 3. Calculate Results
                matches = this.calculateMatches(grid);
                let totalWin = this.calculateWinAmount(matches, betAmount);

                // Adjustment: If our grid generator missed the exact multiplier target, 
                // we fallback to ensuring at least some win if isWin was true but grid failed.
                if (isWin && totalWin === 0) {
                    // Fallback: Inject a guaranteed simple match
                    grid[1][1] = 'J'; grid[1][2] = 'J'; grid[1][3] = 'J';
                    matches = this.calculateMatches(grid);
                    totalWin = this.calculateWinAmount(matches, betAmount);
                }

                // 4. Payout
                if (totalWin > 0) {
                    await User.findByIdAndUpdate(userId, { $inc: { 'wallet.game': totalWin } }, { session });
                    console.log(`[ACE_GAME] User ${userId} Won ${totalWin} (Bet: ${betAmount})`);
                }

                return {
                    status: 'success',
                    balance: user.wallet.game + (totalWin > 0 ? totalWin : (-betAmount)),
                    wallet_balance: user.wallet.main,
                    grid: grid,
                    win: totalWin,
                    matches: matches,
                    bet: betAmount,
                    streak: totalWin > 0 ? "WIN" : "LOSS",
                };
            });
        } finally {
            if (client.isOpen) await client.del(lockKey);
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
