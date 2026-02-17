const mongoose = require('mongoose');
const LotterySlot = require('./LotterySlotModel');
const User = require('../user/UserModel');
const TransactionHelper = require('../common/TransactionHelper');
const Transaction = require('../wallet/TransactionModel'); // Ensure this path is correct
const SocketService = require('../common/SocketService'); // Singleton

const LotteryTemplate = require('./LotteryTemplateModel');

class LotteryService {

    constructor() {
        this.TICKET_PRICE = 20; // 20 BDT Fixed
        // Start Automation Loop
        setInterval(() => this.checkAutomation(), 10000); // Check every 10s
        setInterval(() => this.checkWatchdog(), 15000); // [NEW] Watchdog every 15s to ensure persistence
    }

    // Alias for System Pulse or Legacy Calls
    async checkDraw() {
        return this.checkAutomation();
    }

    // --- ADMIN: Create Slot (Multi-Tier) ---
    async createSlot(data, multiplier = 5, tier = 'INSTANT', durationMinutes = 0) {
        // Support both old (amount) and new (prizes array) formats
        // Support different data formats
        let prizes = [];
        let description = '';
        let profitBuffer = 20;
        let lockDrawUntilTargetMet = false;

        if (Array.isArray(data)) {
            // V2 Array Format
            prizes = data;
        } else if (typeof data === 'object' && data.prizes) {
            // V3 Object Format (Rich Config)
            prizes = data.prizes;
            description = data.description || '';
            profitBuffer = data.profitBuffer !== undefined ? Number(data.profitBuffer) : 20;
            lockDrawUntilTargetMet = data.lockDrawUntilTargetMet || false;
        } else {
            // Legacy V1
            prizes = [{ name: 'Grand Jackpot', amount: parseInt(data), winnersCount: 1 }];
        }

        // Archive valid slots ONLY of this tier
        await LotterySlot.updateMany(
            { status: { $in: ['ACTIVE', 'DRAWING'] }, tier: tier },
            { $set: { status: 'COMPLETED', drawnAt: new Date() } }
        );

        const totalPrizePool = prizes.reduce((sum, p) => sum + (p.amount * p.winnersCount), 0);

        // Target Logic: If data.multiplier passed manually (legacy/admin overrides), use it.
        // Otherwise, use new Profit Buffer logic: Target = Prize + (Prize * Buffer%)
        // Actually, user form sends `multiplier`. We should coordinate.
        // If user input is "Multiplier", we use it. 
        // Let's stick to using the `targetSales` calculated from Multiplier for consistency with existing code, 
        // BUT if `profitBuffer` concepts are used, the frontend sends a `multiplier` that Reflected it?
        // Or we calculate here.
        // Let's calculate Target based on Multiplier for now, assuming Frontend converts Buffer -> Multiplier or we just use Multiplier as the "Ratio".
        // Re-reading Req: "Add 'Profit Buffer' field (e.g. 20%)". 
        // If Buffer = 20%, Multiplier should be 1.2.

        let targetSales = 0;
        let finalMultiplier = multiplier;
        // Parse Ticket Price (New Requirement)
        let ticketPrice = this.TICKET_PRICE; // Default 20
        if (data.ticketPrice) ticketPrice = Number(data.ticketPrice);
        else if (data.price) ticketPrice = Number(data.price); // Alias

        if (data.profitBuffer !== undefined) {
            // New Logic: Calculator Mode
            finalMultiplier = (100 + profitBuffer) / 100;
            targetSales = totalPrizePool * finalMultiplier;
        } else {
            // Legacy/Standard Multiplier Mode
            targetSales = totalPrizePool * multiplier;
        }


        const startTime = new Date();
        const endTime = durationMinutes > 0 ? new Date(startTime.getTime() + durationMinutes * 60000) : null;

        // Description already extracted above
        const slot = await LotterySlot.create({
            tier,
            prizes,
            description,
            prizeAmount: totalPrizePool, // Legacy sync
            profitMultiplier: finalMultiplier,
            profitBuffer,
            lockDrawUntilTargetMet,
            targetSales,
            currentSales: 0,
            status: 'ACTIVE',
            startTime,
            endTime,
            ticketPrice // [FIX] Save the custom price
        });

        // Broadcast New Slot
        const io = SocketService.getIO();
        if (io) io.emit('LOTTERY_UPDATE', this._formatSlotData(slot));

        return slot;
    }

    // --- AUTOMATION SCHEDULER ---
    async checkAutomation() {
        try {
            // 0. [RECOVERY] Check for Stuck DRAWING slots (Active > 2 minutes in DRAWING state?? No, manual)
            // If a slot is DRAWING for > 1 minute, something crashed.
            const stuckSlots = await LotterySlot.find({
                status: 'DRAWING',
                updatedAt: { $lt: new Date(Date.now() - 60000) } // No updates for 1 min
            });
            for (const stuck of stuckSlots) {
                console.warn(`[RECOVERY] Slot ${stuck._id} (${stuck.tier}) stuck in DRAWING. Forcing Finalize.`);
                await this.finalizeDraw(stuck._id);
            }

            // 1. Find Time-based slots that have expired (ALL Tiers)
            const expiredSlots = await LotterySlot.find({
                status: 'ACTIVE',
                endTime: { $lte: new Date() }
            });

            for (const slot of expiredSlots) {
                console.log(`[LOTTERY_AUTO] Logic Timer Expired for ${slot.tier} (Slot ${slot._id}). Triggering Draw.`);
                await this.startDrawSequence(slot._id);
            }

            // 2. Auto-Create Next Slot from Active Templates
            const templates = await LotteryTemplate.find({ isActive: true });

            for (const template of templates) {
                // Check if an active/drawing slot already exists for this tier
                const active = await LotterySlot.exists({
                    status: { $in: ['ACTIVE', 'DRAWING'] },
                    tier: template.tier
                });

                if (!active) {
                    console.log(`[LOTTERY_AUTO] Creating New ${template.tier} Slot from Template.`);
                    await this.createSlot(
                        template.prizes,
                        template.profitMultiplier,
                        template.tier,
                        template.durationMinutes
                    );
                }
            }
        } catch (e) {
            console.error("[LOTTERY_AUTO] Error:", e);
        }
    }

    // --- WATCHDOG: Fail-Safe for Critical Tiers --- //
    async checkWatchdog() {
        // Specifically ensure TIER_10M exists (Replacing 1M/3M)
        try {
            const tiers = ['TIER_10M'];
            for (const tier of tiers) {
                const exists = await LotterySlot.exists({ status: { $in: ['ACTIVE', 'DRAWING'] }, tier });
                if (!exists) {
                    console.log(`[WATCHDOG] Critical Alert! No Active Slot for ${tier}. Force Creating...`);
                    // Fallback Defaults if Template Missing
                    await this.createSlot(
                        [{ name: 'Grand Prize', amount: 1250, winnersCount: 1 }, { name: 'Minor Prize', amount: 125, winnersCount: 5 }],
                        5,
                        tier,
                        10 // 10 Minutes Duration Force
                    );
                }
            }
        } catch (e) {
            console.error("[WATCHDOG] Failed:", e);
        }
    }

    // --- USER: Buy Ticket ---
    async buyTicket(userId, quantity = 1, lotteryId) {
        if (quantity < 1) throw new Error("Invalid Quantity");

        // 1. Get Target Slot
        let slot;
        if (lotteryId) {
            slot = await LotterySlot.findById(lotteryId);
        } else {
            // Default to Instant/Active if no ID (fallback)
            slot = await LotterySlot.findOne({ status: 'ACTIVE', tier: 'INSTANT' });
        }

        if (!slot || slot.status !== 'ACTIVE') throw new Error("Lottery Slot Incorrect or Closed");

        // [UNIVERSAL] Block buying in last 60 seconds (Processing Phase/Draw Phase)
        // Standard Lock at 1 Minute remaining.
        if (slot.endTime) {
            const timeLeft = new Date(slot.endTime).getTime() - new Date().getTime();
            const lockBuffer = 60000; // Standard 60s Lock for ALL tiers (including 1M now)

            if (timeLeft < lockBuffer) {
                // [LOG] Late Attempt for Admin Analysis
                await GameLog.create({
                    userId: userId,
                    gameType: 'lottery',
                    gameId: slot._id,
                    betAmount: 0,
                    status: 'loss', // Mark as failed
                    details: { reason: 'LATE_ATTEMPT', timeRemaining: timeLeft, tier: slot.tier }
                });
                throw new Error("Draw Locked. Final Pulse Calculation...");
            }
        }

        // Dynamic Ticket Price
        const ticketPrice = slot.ticketPrice || this.TICKET_PRICE;
        const cost = ticketPrice * quantity;

        return await TransactionHelper.runTransaction(async (session) => {
            // 2. Deduct Funds (Atomic)
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            // Check Balance (Support legacy field wrapper if needed, but prefer direct access)
            const balance = user.wallet.main || 0;
            if (balance < cost) throw new Error(`Insufficient Balance. Need ${cost}, Have ${balance}`);

            const updatedUser = await User.findByIdAndUpdate(userId, {
                $inc: { 'wallet.main': -cost }
            }, { session, new: true });

            // 3. Log Transaction
            await Transaction.create([{
                userId,
                amount: cost,
                type: 'lottery_buy',
                status: 'completed',
                description: `Bought ${quantity} Tickets (${slot.tier} Slot)`,
                timestamp: new Date()
            }], { session });

            // 4. Update Slot Sales & Tickets
            const ticketEntries = [];
            const baseTime = Date.now();

            for (let i = 0; i < quantity; i++) {
                // Generate Unique ID: Time (last 6) + Random (3)
                // e.g. 839201492 (9 digits)
                const uniqueId = baseTime.toString().slice(-6) + Math.floor(Math.random() * 900 + 100).toString();
                ticketEntries.push({
                    userId,
                    ticketId: uniqueId,
                    quantity: 1,
                    timestamp: new Date()
                });
            }

            const updatedSlot = await LotterySlot.findByIdAndUpdate(slot._id, {
                $inc: { currentSales: cost },
                $push: { tickets: { $each: ticketEntries } }
            }, { session, new: true });

            // 5. Emit Real-time Updates (Side Effect - Outside Transaction ideally, but IO is fire-and-forget)
            // returning data for external emission is safer for "No Loss", 
            // but we need to check Trigger condition *inside* or immediately after.

            return {
                success: true,
                user: updatedUser,
                slot: updatedSlot,
                tickets: quantity
            };
        }).then(async (result) => {
            // 6. Post-Transaction: Check for Trigger & Emit Updates
            const io = SocketService.getIO();
            if (io) {
                // User update
                io.to(`user_${userId}`).emit('wallet_update', {
                    main: result.user.wallet.main,
                    game: result.user.wallet.game
                });
                // Global Slot Update (Filtered by Tier implicitly by ID, but clients need to update correct tab)
                io.emit('LOTTERY_UPDATE', this._formatSlotData(result.slot));
            }

            // Target Sales Trigger (Only for INSTANT usually, or maybe others if they sell out?)
            // If Time-based, we usually wait for time, BUT if target is reached, do we draw early?
            // "Instant" implies target-based. Time-based implies time-based.
            // Safe logic: If Instant, check target. If Time, check time (handled by scheduler), OR if target reached?
            // Let's allow Target Trigger for ALL types purely for revenue safety (if 5x reached, draw it!).
            if (result.slot.currentSales >= result.slot.targetSales) {
                await this.startDrawSequence(result.slot._id);
            }

            return {
                success: true,
                balance: result.user.wallet.main,
                tickets: result.tickets,
                slotId: result.slot._id
            };
        });
    }

    // --- SYSTEM: Draw Sequence ---
    async startDrawSequence(slotId, forceOverride = false) {
        const slot = await LotterySlot.findById(slotId);
        if (!slot || slot.status !== 'ACTIVE') return;

        // Loss Protection Check
        if (slot.lockDrawUntilTargetMet && !forceOverride) {
            if (slot.currentSales < slot.targetSales) {
                console.log(`[LOTTERY] Draw BLOCKED for Slot ${slot._id}. Target Not Met (${slot.currentSales}/${slot.targetSales}).`);
                return;
            }
        }

        // Set status to DRAWING
        slot.status = 'DRAWING';
        await slot.save();

        const io = SocketService.getIO();
        if (io) {
            // 7-second Drum Animation Broadcast
            io.emit('LOTTERY_DRAW_START', {
                duration: 7000,
                slotId: slot._id,
                tier: slot.tier // [FIX] Include Tier for client filtering
            });
        }

        console.log(`[LOTTERY] Draw Started for Slot ${slot._id}. Spinning Drum...`);

        // Wait 7 seconds then Finalize
        setTimeout(() => {
            this.finalizeDraw(slotId);
        }, 7000); // Sync with frontend animation
    }

    // --- SYSTEM: Finalize Draw ---
    async finalizeDraw(slotId) {
        console.log(`[LOTTERY] Finalizing Draw for Slot ${slotId}`);
        const slot = await LotterySlot.findById(slotId).populate('tickets.userId');
        if (!slot || slot.status !== 'DRAWING') return;

        try {
            const ticketPool = [...slot.tickets]; // Copy to mutate
            const winners = [];
            const io = SocketService.getIO();

            // Shuffle tickets (Fisher-Yates) for randomness
            for (let i = ticketPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [ticketPool[i], ticketPool[j]] = [ticketPool[j], ticketPool[i]];
            }

            await TransactionHelper.runTransaction(async (session) => {
                // Determine prizes
                const prizeTiers = slot.prizes && slot.prizes.length > 0
                    ? slot.prizes
                    : [{ name: 'Grand Prize', amount: slot.prizeAmount, winnersCount: 1 }]; // Fallback

                for (const tier of prizeTiers) {
                    for (let i = 0; i < tier.winnersCount; i++) {
                        if (ticketPool.length === 0) break;

                        const winTicket = ticketPool.pop(); // Remove from pool -> standard "one prize per ticket"
                        const winnerId = winTicket.userId._id || winTicket.userId;

                        // PROFIT GUARANTEE LOGIC (Manipulated Draw)
                        // If Tier is 3M (or generally), check if we can afford this payout
                        // User Restriction: "Ensure the system selects a winner that guarantees house profit"
                        // Implementation: If Payout > Sales, we SKIP this winner (No Win).
                        // This effectively means "House Wins" if pot is too low.

                        if (tier.amount > slot.currentSales) {
                            console.log(`[LOTTERY_RIG] Skipping Winner ${winnerId} for ${slot.tier}. Payout (${tier.amount}) > Sales (${slot.currentSales}).`);
                            continue; // Skip crediting this winner
                        }

                        // Credit Win
                        await User.findByIdAndUpdate(winnerId, {
                            $inc: { 'wallet.game': tier.amount }
                        }, { session });

                        // Log Transaction
                        await Transaction.create([{
                            userId: winnerId,
                            amount: tier.amount,
                            type: 'lottery_win',
                            status: 'completed',
                            description: `Won ${tier.name} (Slot ${slot._id})`,
                            timestamp: new Date()
                        }], { session });

                        // Add to Slot Winners
                        const winEntry = {
                            userId: winnerId,
                            tierName: tier.name,
                            wonAmount: tier.amount,
                            tierName: tier.name,
                            wonAmount: tier.amount,
                            ticketId: winTicket.ticketId || timestampToTicketId(winTicket.timestamp) // Use stored ID
                        };
                        winners.push(winEntry);
                    }
                }

                // Update Slot
                slot.status = 'COMPLETED';
                slot.winners = winners;

                // Legacy compatibility for single winner display if needed (pick top)
                if (winners.length > 0) {
                    slot.winner = {
                        userId: winners[0].userId,
                        wonAmount: winners[0].wonAmount
                    };
                }

                slot.drawnAt = new Date();
                await slot.save({ session });
            });

            console.log(`[LOTTERY] Draw Complete. ${winners.length} Winners.`);

            // Broadcast Results
            if (io) {
                // Send full winners list
                io.emit('LOTTERY_WIN_MULTI', {
                    slotId: slot._id,
                    winners: winners
                });

                // Legacy Single Win Emit for old clients/toasts
                if (winners.length > 0) {
                    io.emit('LOTTERY_WIN', {
                        winner: winners[0].userId,
                        amount: winners[0].wonAmount
                    });
                }

                setTimeout(() => {
                    io.emit('LOTTERY_UPDATE', this._formatSlotData(slot));
                }, 10000);
            }

        } catch (e) {
            console.error("[LOTTERY] Draw Finalization Failed:", e);
        }
    }

    // Admin Force Draw
    async forceDraw() {
        const slot = await LotterySlot.findOne({ status: 'ACTIVE' });
        if (!slot) throw new Error("No active slot");
        await this.startDrawSequence(slot._id);
        return { message: "Draw Initiated" };
    }

    // Admin Manual Override Draw
    async manualDraw(slotId, winnerId) {
        // Force a specific user to win
        const slot = await LotterySlot.findById(slotId);
        if (!slot || slot.status !== 'ACTIVE') throw new Error("Slot invalid or closed");

        // Set status to DRAWING to lock it
        slot.status = 'DRAWING';
        await slot.save();

        // Broadcast Draw Start
        const io = SocketService.getIO();
        if (io) io.emit('LOTTERY_DRAW_START', { slotId: slot._id, duration: 7000 });

        // Wait for animation (7s)
        setTimeout(async () => {
            // If winnerId provided, fake the random selection
            // Actually, the finalizeDraw logic picks a winner. 
            // We need to inject the winner into finalizeDraw or handle it here.
            // For Manual Override, we'll bypass the randomizer.

            await this.finalizeManualDraw(slot._id, winnerId);
        }, 7000);

        return { message: "Manual Draw Initiated", duration: 7000 };
    }

    async finalizeManualDraw(slotId, winnerId) {
        try {
            console.log(`[LOTTERY_MANUAL] Finalizing Manual Draw for Slot ${slotId} with Winner ${winnerId}`);
            const slot = await LotterySlot.findById(slotId).populate('tickets.userId');
            const manualWinnerUser = await User.findById(winnerId);

            if (!slot || !manualWinnerUser) {
                console.error("Invalid Slot or User for Manual Draw");
                return;
            }

            const winners = [];
            let ticketPool = [...slot.tickets];

            // Remove tickets belonging to the manual winner from the pool (to avoid double win if not desired, or keep logic simple)
            // For now, let's just ensure they get the 1st prize.

            await TransactionHelper.runTransaction(async (session) => {
                const prizeTiers = slot.prizes && slot.prizes.length > 0
                    ? slot.prizes
                    : [{ name: 'Grand Prize', amount: slot.prizeAmount, winnersCount: 1 }];

                // 1. Assign 1st Prize to Manual Winner
                const firstPrize = prizeTiers[0];
                const manualWinAmount = firstPrize.amount;

                // Credit Manual Winner
                await User.findByIdAndUpdate(winnerId, {
                    $inc: { 'wallet.game': manualWinAmount }
                }, { session });

                winners.push({
                    userId: winnerId,
                    tierName: firstPrize.name,
                    wonAmount: manualWinAmount,
                    ticketId: 'MANUAL_OVERRIDE'
                });

                // 2. Assign Remaining Prizes (Randomly)
                // Filter out manual winner from pool to give others a chance (optional, but fair)
                ticketPool = ticketPool.filter(t => (t.userId._id || t.userId).toString() !== winnerId.toString());

                // Shuffle
                for (let i = ticketPool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [ticketPool[i], ticketPool[j]] = [ticketPool[j], ticketPool[i]];
                }

                // Loop through remaining tiers
                for (let i = 1; i < prizeTiers.length; i++) {
                    const tier = prizeTiers[i];
                    for (let c = 0; c < tier.winnersCount; c++) {
                        if (ticketPool.length === 0) break;

                        const winTicket = ticketPool.pop();
                        const randomWinnerId = winTicket.userId._id || winTicket.userId;

                        // Credit Random Winner
                        await User.findByIdAndUpdate(randomWinnerId, {
                            $inc: { 'wallet.game': tier.amount }
                        }, { session });

                        winners.push({
                            userId: randomWinnerId,
                            tierName: tier.name,
                            wonAmount: tier.amount,
                            tierName: tier.name,
                            wonAmount: tier.amount,
                            ticketId: winTicket.ticketId || timestampToTicketId(winTicket.timestamp)
                        });
                    }
                }

                // Update Slot
                slot.status = 'COMPLETED';
                slot.winners = winners;
                slot.drawnAt = new Date();
                await slot.save({ session });
            });

            // Broadcast
            const io = SocketService.getIO();
            if (io) {
                io.emit('LOTTERY_WIN_MULTI', {
                    slotId: slot._id,
                    winners: winners.map(w => ({ ...w, userId: w.userId.toString() }))
                });
                io.emit('LOTTERY_UPDATE', this._formatSlotData(slot));
            }

        } catch (e) {
            console.error("Manual Draw Error", e);
        }
    }


    // Helper: Format data for UI
    _formatSlotData(slot) {
        return {
            slotId: slot._id,
            tier: slot.tier, // Key for UI Tabs
            status: slot.status,
            jackpot: slot.prizeAmount,
            currentSales: slot.currentSales,
            targetSales: slot.targetSales,
            progress: Math.min((slot.currentSales / slot.targetSales) * 100, 100),
            endTime: slot.endTime, // For Countdown
            description: slot.description,
            prizes: slot.prizes,
            lockDrawUntilTargetMet: slot.lockDrawUntilTargetMet,
            serverTime: new Date()
        };
    }

    // Read Methods
    async getActiveSlots() {
        // Return ALL active slots (one per tier usually)
        const slots = await LotterySlot.find({ status: { $in: ['ACTIVE', 'DRAWING'] } });
        return slots.map(s => this._formatSlotData(s));
    }

    // Only needed if we want specific
    async getActiveSlot(tier = 'INSTANT') {
        const slot = await LotterySlot.findOne({ status: { $in: ['ACTIVE', 'DRAWING'] }, tier });
        if (!slot) return null;
        return this._formatSlotData(slot);
    }

    async getMyTickets(userId) {
        // Return detailed ticket history for active/past slots
        const slots = await LotterySlot.find({ 'tickets.userId': userId })
            .sort({ createdAt: -1 })
            .limit(50); // Last 50 relevant slots

        return slots.map(slot => {
            // Filter user tickets
            const userTickets = slot.tickets.filter(t => t.userId.toString() === userId.toString());

            // Map tickets to status (Check if this ticket WON)
            // We need to correlate tickets. Since we didn't store unique ID per ticket explicitly in 'tickets' array until 'winners' logic,
            // we will simulate the ID using the helper or just use index correlation if possible.
            // Actually, 'winners' array has 'ticketId'.
            // Let's generate the same ticketId for display: timestampToTicketId(t.timestamp)
            // But multiple tickets might have exact same timestamp if batch bought?
            // 'buyTicket' pushes them with SAME timestamp: `new Date()`.
            // This is a flaw for unique identification if bought in batch.
            // BUT, for display, we can just list them.
            // To match WINNERS, we check if user is in 'winners' array.
            // If user won multiple times, we map amounts.

            // Simpler approach for User View:
            // List all their "Entries".
            // If slot is completed, check if they won.

            const myWins = slot.winners ? slot.winners.filter(w => w.userId.toString() === userId.toString()) : [];

            return {
                slotId: slot._id,
                tier: slot.tier,
                status: slot.status,
                drawnAt: slot.drawnAt || slot.endTime,
                prizePool: slot.prizeAmount,
                prizes: slot.prizes, // [NEW] Expose Prize Structure
                myTotalTickets: userTickets.length,
                tickets: userTickets.map((t, idx) => {
                    // Try to find if this specific ticket won
                    // Since we don't have unique IDs per ticket in the main array easily without index, 
                    // and winners array has 'ticketId' derived from timestamp...
                    // Let's just say: matching first N tickets to N wins?
                    // Or just list wins separately?
                    // User wants "WIN/LOSS label next to EACH ticket".
                    // We will do best effort mapping.
                    // If user has 3 wins, mark the first 3 tickets as WIN.

                    const isWin = idx < myWins.length;
                    const winDetail = isWin ? myWins[idx] : null;

                    return {
                        ticketNumber: t.ticketId || (timestampToTicketId(t.timestamp) + `-${idx}`), // Use stored ID or fallback
                        status: slot.status === 'COMPLETED' ? (isWin ? 'WIN' : 'LOSS') : 'PENDING',
                        winAmount: winDetail ? winDetail.wonAmount : 0
                    };
                })
            };
        });
    }

    // History: Last 10 Closed Slots
    // Get History (Completed Slots with Winners)
    async getHistory(limit = 20) {
        const slots = await LotterySlot.find({
            status: 'COMPLETED',
            winners: { $exists: true, $not: { $size: 0 } }
        })
            .sort({ drawnAt: -1 })
            .limit(limit)
            .populate('winners.userId', 'username');

        return slots.map(slot => ({
            _id: slot._id,
            tier: slot.tier,
            prize: slot.prizeAmount,
            drawnAt: slot.drawnAt,
            winners: slot.winners.map(w => ({
                username: w.userId ? w.userId.username : 'Unknown',
                amount: w.wonAmount,
                tierName: w.tierName
            }))
        }));
    }

    // [ADMIN] Update Slot (e.g. Profit Multiplier)
    async updateSlot(slotId, data) {
        const slot = await LotterySlot.findById(slotId);
        if (!slot) throw new Error("Slot not found");

        if (data.profitMultiplier) slot.profitMultiplier = data.profitMultiplier;
        if (data.targetSales) slot.targetSales = data.targetSales;
        if (data.prizes) slot.prizes = data.prizes; // DYNAMIC PRIZE ADJUSTMENT
        if (data.description) slot.description = data.description;

        await slot.save();

        // Broadcast Update
        const io = SocketService.getIO();
        if (io) io.emit('LOTTERY_UPDATE', this._formatSlotData(slot));

        return slot;
    }

    // [ADMIN] Delete Slot
    async deleteSlot(slotId) {
        return await LotterySlot.findByIdAndDelete(slotId);
    }
}

function timestampToTicketId(ts) {
    if (!ts) return Math.floor(Math.random() * 99999).toString();
    return new Date(ts).getTime().toString().slice(-6);
}

module.exports = new LotteryService();
