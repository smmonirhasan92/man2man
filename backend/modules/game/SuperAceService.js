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
                const PITY_THRESHOLD = 3; // Reduced from 4 (Faster Pity)
                const BASE_HIT_RATE = 0.45; // Increased from 0.40 (More Action)
                const SCATTER_CHANCE = 0.03; // Slight boost to Feature teaser

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
                    if (client && client.isOpen) {
                        await client.set(fsKey, (freeSpinsLeft + 10).toString());
                        await client.set(streakKey, '0');
                    }
                    console.log(`[ACE_GAME] 🌟 SCATTER TRIGGERED for ${userId}`);
                }
                else if (isWin) {
                    const rand = Math.random();
                    if (isPityWin) {
                        // Pity win: Just enough to stay alive (1.0x - 1.5x)
                        multiplier = 1.0 + (Math.random() * 0.5);
                    } else {
                        // [NEW MATH MODEL - "THE TEASE"]
                        // User Complaint: "Consistent Losing". Fix: Give real profit.

                        // 00-40%: Small Profit (1.1x - 1.8x) - "I won!" (Not 0.8x partial loss)
                        if (rand < 0.40) multiplier = 1.1 + (Math.random() * 0.7);
                        // 40-75%: Solid Profit (2.0x - 3.8x)
                        else if (rand < 0.75) multiplier = 2.0 + (Math.random() * 1.8);
                        // 75-95%: Big Win (4.0x - 8.0x) - TRAP ZONE
                        else if (rand < 0.95) multiplier = 4.0 + (Math.random() * 4.0);
                        // 95-100%: Super Win (10x+) - DEEP TRAP
                        else multiplier = 10.0 + (Math.random() * 20.0);
                    }

                    totalWin = parseFloat((betAmount * multiplier).toFixed(2));

                    // [SAFETY CHECK]
                    let isSafe = true;
                    // Relaxed safety for trapped wins since they don't leave the eco immediately
                    if (multiplier > 8.0) isSafe = await ProfitGuard.enforceSafety(totalWin);

                    if (isSafe) {
                        grid = self.generateWinningGrid(multiplier);
                        if (client && client.isOpen) await client.set(streakKey, '0');
                    } else {
                        // Force Loss (Safety block)
                        totalWin = 0;
                        multiplier = 0;
                        grid = self.generateLosingGrid();
                        if (!isFreeGame && client && client.isOpen) await client.incr(streakKey);
                    }
                } else {
                    // LOSS (RNG)
                    totalWin = 0;
                    grid = self.generateLosingGrid();
                    if (!isFreeGame && client && client.isOpen) await client.incr(streakKey);
                }

                // [WIN-LOCK & SPIN-TO-RELEASE POLICY] 🔐
                // Logic:
                // 1. Check if Vault Release is due (Count reached 10)
                // 2. Decrement Spin Count (Increase 'completed' by 1 if 'required' is small, indicating count mode)

                let checkVaultRelease = false;
                let vaultReleasedAmount = 0;
                let trappedAmount = 0;

                // DETECT MODE: If required is small (e.g. <= 20), it's a SPIN COUNT. If large, it's AMOUNT.
                // For this policy, we use SPIN COUNT = 10.
                const isSpinCountMode = user.wallet.turnover && user.wallet.turnover.required > 0 && user.wallet.turnover.required <= 50;

                if (user.wallet.game_locked > 0 && isSpinCountMode) {
                    // Increment Spin Count
                    user.wallet.turnover.completed += 1; // 1 Spin

                    // Check Release
                    if (user.wallet.turnover.completed >= user.wallet.turnover.required) {
                        checkVaultRelease = true;
                        vaultReleasedAmount = user.wallet.game_locked;

                        const preVaultBal = user.wallet.game;
                        user.wallet.game += vaultReleasedAmount;
                        user.wallet.game_locked = 0;
                        user.wallet.turnover.required = 0;
                        user.wallet.turnover.completed = 0;

                        await TransactionLedger.create([{
                            userId, type: 'vault_release', amount: vaultReleasedAmount,
                            balanceBefore: preVaultBal, balanceAfter: user.wallet.game,
                            description: 'Treasury Unlocked! 10 Spins Completed.',
                            transactionId: `VAULT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            metadata: { game: 'super-ace', wallet: 'game', spinsWrapped: 10 }
                        }], { session });

                        console.log(`[ACE_GAME] 🔓 TREASURE UNLOCKED! Released ${vaultReleasedAmount}`);
                    }
                }

                // [RTP & WIN LOGIC] - 60/40 Split
                // Win >= 100 -> LOCK IT.
                if (totalWin > 0) {
                    const WIN_LOCK_THRESHOLD = 100;

                    if (totalWin >= WIN_LOCK_THRESHOLD) {
                        // LOCK THE WIN
                        trappedAmount = totalWin;
                        user.wallet.game_locked += trappedAmount;

                        // Set Spin Count Requirement
                        if (!user.wallet.turnover) user.wallet.turnover = { required: 0, completed: 0 };

                        // If already locked, just add to amount, reset count to 10? Or keep existing count?
                        // Policy: "Complete 10 Spins to Unlock THIS Prize". 
                        // Let's reset count to 10 to require fresh engagement for new big win, or add 10?
                        // Simplest: Reset to 10 if 0, or add 5 if existing? 
                        // User says "Create a spin_lock_counter set to 10". Implies Reset.
                        user.wallet.turnover.required = 10;
                        user.wallet.turnover.completed = 0;

                        console.log(`[ACE_GAME] 🔐 WIN LOCKED: ${trappedAmount} BDT. Req: 10 Spins.`);

                        await TransactionLedger.create([{
                            userId, type: 'win_locked', amount: trappedAmount,
                            balanceBefore: user.wallet.game, balanceAfter: user.wallet.game,
                            description: 'Big Win Locked (Spin to Release)',
                            transactionId: `LOCK_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            metadata: { game: 'super-ace', wallet: 'game_locked', spinsReq: 10 }
                        }], { session });

                    } else {
                        // Direct Payout for small wins
                        user.wallet.game += totalWin;
                        await TransactionLedger.create([{
                            userId, type: 'win', amount: totalWin,
                            balanceBefore: user.wallet.game - totalWin, balanceAfter: user.wallet.game,
                            description: 'Super Ace Win',
                            transactionId: `WIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                            metadata: { game: 'super-ace' }
                        }], { session });
                    }
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
                    isScatter: isScatter,
                    vault: {
                        locked: user.wallet.game_locked,
                        // Send Spin Count specifically
                        requiredSpins: 10,
                        remainingSpins: Math.max(0, user.wallet.turnover.required - user.wallet.turnover.completed),
                        wasReleased: checkVaultRelease,
                        releasedAmount: vaultReleasedAmount,
                        trappedAmount: trappedAmount,
                        isSpinLock: true // Flag for frontend to show "Spins" not "$"
                    }
                };
            });
        } finally {
            if (client && client.isOpen) await client.del(lockKey);
        }
    }

    // --- LOGIC HELPERS ---

    // Define standard reel strips (simplified for "realistic" feel)
    // Coherent sequences allow for natural "near misses" and "stacks"
    get REEL_STRIPS() {
        return [
            ['J', 'J', 'Q', 'A', 'S1', 'S2', 'K', 'K', 'J', 'S3', 'A', 'A', 'S1', 'Q', 'Q', 'S2', 'J', 'K', 'S3', 'S3'],
            ['Q', 'Q', 'K', 'S1', 'J', 'J', 'S2', 'A', 'K', 'Q', 'S3', 'S3', 'J', 'A', 'A', 'S1', 'S2', 'K', 'Q', 'J'],
            ['K', 'K', 'A', 'S2', 'Q', 'Q', 'S3', 'J', 'K', 'A', 'S1', 'S1', 'Q', 'J', 'J', 'S2', 'A', 'K', 'S3', 'Q'],
            ['A', 'A', 'S1', 'S3', 'K', 'K', 'J', 'Q', 'A', 'S2', 'S2', 'S1', 'K', 'J', 'J', 'Q', 'A', 'S3', 'K', 'A'],
            ['S1', 'S2', 'S3', 'J', 'Q', 'K', 'A', 'S1', 'S2', 'J', 'Q', 'K', 'A', 'S3', 'S3', 'S2', 'S1', 'A', 'K', 'Q']
        ];
    }

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
        // Start with a realistic losing grid so the background looks natural
        const grid = this.generateLosingGrid();

        // Basic 3-match override
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
        const grid = [];
        const strips = this.REEL_STRIPS;

        // [NEAR MISS LOGIC]
        // 35% chance to create a "Tease" (almost a win)
        const isNearMiss = Math.random() < 0.35;

        for (let c = 0; c < 5; c++) {
            const strip = strips[c];
            // Pick a random start position on the strip
            // Virtual Strip length is longer to simulate endless scrolling
            const startIdx = Math.floor(Math.random() * strip.length);

            const col = [];
            for (let r = 0; r < 4; r++) {
                // Wrap around index
                const symIndex = (startIdx + r) % strip.length;
                col.push(strip[symIndex]);
            }
            grid.push(col);
        }

        if (isNearMiss) {
            // Overwrite to create a "Near Miss" tension
            // Example: Two Aces in first column, one in second, but missing the third
            // Or Stacks that don't quite align

            // Stacked Wild Tease
            if (Math.random() < 0.5) {
                grid[2][0] = 'GOLD_K';
                grid[2][1] = 'GOLD_K';
                grid[2][2] = 'S1'; // Blocked
            } else {
                // Scatter Tease
                grid[1][Math.floor(Math.random() * 4)] = 'SCATTER';
                grid[3][Math.floor(Math.random() * 4)] = 'SCATTER';
                // No 3rd scatter
            }
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
