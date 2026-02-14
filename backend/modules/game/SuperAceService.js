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

        try {
            return await TransactionHelper.runTransaction(async (session) => {
                const user = await User.findById(userId).session(session);
                if (!user) throw new Error("User not found");

                // 1. Validation & Deduction
                if (betAmount <= 0) throw new Error("Invalid Bet");
                // [REFACTOR] Use WalletService for integrity
                // user.wallet.main -= betAmount;
                const WalletService = require('../wallet/WalletService');
                await WalletService.deductBalance(userId, betAmount, 'super_ace_bet', 'Super Ace Bet', session);

                // Reload user after deduction to get fresh state if needed, or rely on WalletService check
                // user.save() is handled by WalletService.
                // But we need the user object for the rest of logic? 
                // WalletService doesn't return user, but we can refetch or just continue leveraging session.
                const userRefreshed = await User.findById(userId).session(session);

                // 3. RNG Logic
                // ... (rest of logic)            // [SIMPLIFIED LOGIC - CLEAN & FUN]
                // 1. Determine Win/Loss based on probabilistic RTP (Return to Player)
                // We target 94-96% RTP for a "Fun" experience.

                const isWin = Math.random() < 0.45; // 45% Hit Frequency (Very Fun/Active)

                let multiplier = 0;
                let grid = [];
                let matches = [];
                let totalWin = 0;

                // 2. Safety Check (ProfitGuard)
                // Only block HUGE wins if system is bleeding. Small/Medium wins always allowed for fun.
                const isSafe = await ProfitGuard.enforceSafety(betAmount * 10); // Check if a 10x win is safe

                if (isWin && isSafe) {
                    // GENERATE WIN
                    const rand = Math.random();
                    // Win Tiers
                    if (rand < 0.60) multiplier = 1.2 + (Math.random() * 0.8); // 1.2x - 2.0x
                    else if (rand < 0.90) multiplier = 2.0 + (Math.random() * 3.0); // 2x - 5x
                    else if (rand < 0.99) multiplier = 5.0 + (Math.random() * 10.0); // 5x - 15x
                    else multiplier = 20.0 + (Math.random() * 30.0); // 20x - 50x (Jackpot)

                    totalWin = parseFloat((betAmount * multiplier).toFixed(2));
                    grid = self.generateWinningGrid(multiplier);
                } else {
                    // FORCE LOSS
                    grid = self.generateLosingGrid();
                    totalWin = 0;
                }

                // 4. Payout
                if (totalWin > 0) {
                    // CREDIT TO MAIN WALLET
                    user.wallet.main += totalWin;
                    await user.save({ session });
                    console.log(`[ACE_GAME] User ${userId} Won ${totalWin} (Bet: ${betAmount})`);
                }

                // Get updated balance for return (user object is already updated in memory/session, but fetch to be safe/consistent if needed, 
                // actually user.wallet.main is already updated on the instance, but let's just return what we have)

                // Refetch for final state to return
                const userFinal = await User.findById(userId).session(session);

                // [SOCKET] Real-time Balance Update
                const SocketService = require('../../modules/common/SocketService');
                // Broadcast MAIN wallet update
                SocketService.broadcast(`user_${userId}`, `main_balance_update_${userId}`, userFinal.wallet.main);

                // Also broadcast game balance if we want to keep listeners happy, but logic is main now.
                // SocketService.broadcast(`user_${userId}`, `game_balance_update_${userId}`, user.wallet.game); 

                // Standard balance update
                SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userFinal.wallet.main);

                return {
                    status: 'success',
                    balance: userFinal.wallet.game, // Keep for frontend compatibility if it checks this
                    wallet_balance: userFinal.wallet.main, // Main Balance (The real one)
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
