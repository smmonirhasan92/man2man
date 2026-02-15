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

                // --- FREE SPIN STATE ---
                const fsKey = `gamestate:freespins:${userId}`;
                let freeSpinsLeft = 0;
                if (client && client.isOpen) {
                    freeSpinsLeft = parseInt(await client.get(fsKey) || '0');
                }
                const isFreeGame = freeSpinsLeft > 0;

                // 1. Validation & Deduction
                if (betAmount <= 0) throw new Error("Invalid Bet");

                if (!isFreeGame) {
                    // Normal Spend
                    if ((user.wallet.game || 0) < betAmount) {
                        throw new Error("Insufficient Game Balance. Please Transfer Funds to Game Wallet.");
                    }
                    const balBefore = user.wallet.game;
                    user.wallet.game -= betAmount;

                    // [LEDGER] Log Bet
                    await TransactionLedger.create([{
                        userId, type: 'debit', amount: -betAmount,
                        balanceBefore: balBefore, balanceAfter: user.wallet.game,
                        description: 'Super Ace Bet',
                        transactionId: `BET_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        metadata: { game: 'super-ace', wallet: 'game' }
                    }], { session });

                    // Increment Completed Turnover
                    if (!user.wallet.turnover) user.wallet.turnover = { required: 0, completed: 0 };
                    user.wallet.turnover.completed += betAmount;

                } else {
                    // Free Spin (No Deduction)
                    // Decrement Free Spin Counter
                    freeSpinsLeft--;
                    if (client && client.isOpen) await client.set(fsKey, freeSpinsLeft.toString());
                    console.log(`[ACE_GAME] User ${userId} used Free Spin. Remaining: ${freeSpinsLeft}`);
                }

                // 2. RNG Logic & Excitement Engine 🎰
                const streakKey = `streak:loss:${userId}`;
                let lossStreak = 0;
                if (client && client.isOpen) lossStreak = parseInt(await client.get(streakKey) || '0');

                // [EXCITEMENT PARAMETERS]
                const PITY_THRESHOLD = 4;
                const BASE_HIT_RATE = 0.48;
                const SCATTER_CHANCE = 0.02; // 2% Chance for 3 Scatters (Free Spins)

                let isWin = Math.random() < BASE_HIT_RATE;
                let isScatter = Math.random() < SCATTER_CHANCE;
                let isPityWin = false;

                // [STREAK BREAKER]
                if (!isFreeGame && lossStreak >= PITY_THRESHOLD) {
                    isWin = true;
                    isPityWin = true;
                }

                let multiplier = 0;
                let grid = [];
                let totalWin = 0;
                let awardedFreeSpins = 0;

                if (isScatter) {
                    // --- SCATTER WIN ---
                    awardedFreeSpins = 10;
                    grid = self.generateScatterGrid();
                    // Scatters usually pay a small amount too or just trigger features. 
                    // Let's assume they don't pay direct cash unless matched, but for simplicity, we focus on the FEATURE.
                    if (client && client.isOpen) {
                        await client.set(fsKey, (freeSpinsLeft + 10).toString());
                        // Also reset streak on feature trigger
                        await client.set(streakKey, '0');
                    }
                    console.log(`[ACE_GAME] 🌟 SCATTER TRIGGERED for ${userId}`);
                }
                else if (isWin) {
                    const rand = Math.random();
                    if (isPityWin) {
                        multiplier = 0.5 + (Math.random() * 1.5);
                    } else {
                        if (rand < 0.50) multiplier = 0.2 + (Math.random() * 0.7);
                        else if (rand < 0.80) multiplier = 1.1 + (Math.random() * 1.9);
                        else if (rand < 0.96) multiplier = 3.0 + (Math.random() * 7.0);
                        else multiplier = 15.0 + (Math.random() * 35.0);
                    }

                    totalWin = parseFloat((betAmount * multiplier).toFixed(2));

                    // [SAFETY CHECK]
                    let isSafe = true;
                    if (multiplier > 3.0) isSafe = await ProfitGuard.enforceSafety(totalWin);

                    if (isSafe) {
                        grid = self.generateWinningGrid(multiplier);
                        if (client && client.isOpen) await client.set(streakKey, '0');

                        // [TURNOVER TRAP] 🪤
                        // If Big Win (>5x), lock it by adding to Turnover Requirement
                        if (multiplier >= 5.0) {
                            if (!user.wallet.turnover) user.wallet.turnover = { required: 0, completed: 0 };
                            // Add 1x turnover requirement on the winning amount
                            user.wallet.turnover.required += totalWin;
                            console.log(`[ACE_GAME] 🪤 TRAP SET: Added ${totalWin} to Turnover Req for ${userId}`);
                        }

                    } else {
                        // Force Loss
                        totalWin = 0;
                        grid = self.generateLosingGrid();
                        if (!isFreeGame && client && client.isOpen) await client.incr(streakKey);
                    }
                } else {
                    // LOSS
                    totalWin = 0;
                    grid = self.generateLosingGrid();
                    if (!isFreeGame && client && client.isOpen) await client.incr(streakKey);
                }

                // 3. Payout
                if (totalWin > 0) {
                    const balBefore = user.wallet.game;
                    user.wallet.game += totalWin;

                    await TransactionLedger.create([{
                        userId, type: 'credit', amount: totalWin,
                        balanceBefore: balBefore, balanceAfter: user.wallet.game,
                        description: isFreeGame ? 'Super Ace Win (Free Spin)' : 'Super Ace Win',
                        transactionId: `WIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        metadata: { game: 'super-ace', multiplier: multiplier.toFixed(2), wallet: 'game', isPity: isPityWin }
                    }], { session });

                    console.log(`[ACE_GAME] User ${userId} Won ${totalWin}`);
                }

                user.game_balance = user.wallet.game;
                await user.save({ session });

                // Socket
                const SocketService = require('../../modules/common/SocketService');
                SocketService.broadcast(`user_${userId}`, `game_balance_update_${userId}`, user.wallet.game);
                SocketService.broadcast(`user_${userId}`, `balance_update`, user.wallet);

                return {
                    status: 'success',
                    balance: user.wallet.game,
                    wallet_balance: user.wallet.main,
                    grid: grid,
                    win: totalWin,
                    bet: betAmount,
                    streak: totalWin > 0 ? "WIN" : "LOSS",
                    isFreeGame: isFreeGame,
                    freeSpinsLeft: isScatter ? (freeSpinsLeft + 10) : freeSpinsLeft,
                    isScatter: isScatter // Signal frontend to show animation
                };
            });
        } finally {
            if (client && client.isOpen) await client.del(lockKey);
        }
    }

    // --- LOGIC HELPERS ---

    generateScatterGrid() {
        const grid = this.generateLosingGrid();
        // Place 3 Scatters (Trigger)
        grid[1][1] = 'SCATTER';
        grid[2][2] = 'SCATTER';
        grid[3][3] = 'SCATTER';
        return grid;
    }

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
