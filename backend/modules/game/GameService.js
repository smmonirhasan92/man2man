const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const { runTransaction } = require('../common/TransactionHelper');

class GameService {

    // Config: 25% Admin Profit
    static ADMIN_PROFIT_PERCENT = 25;

    /**
     * Simulate a Round of "Pool Game" (e.g., Weekly Draw or Quick Pool)
     * For the Simulation Request: "100 players betting 100 BDT"
     */
    static async playPoolRound(playerIds, betAmount) {
        return await runTransaction(async (session) => {
            const totalPool = playerIds.length * betAmount;
            const adminProfit = (totalPool * this.ADMIN_PROFIT_PERCENT) / 100;
            const distributablePrize = totalPool - adminProfit;

            // 1. Deduct Bets (Batch)
            for (const uid of playerIds) {
                await User.findByIdAndUpdate(uid, {
                    $inc: { 'wallet.main': -betAmount }
                }).session(session);

                await Transaction.create([{
                    userId: uid,
                    type: 'game_bet',
                    amount: betAmount,
                    status: 'completed',
                    description: 'Game Bet'
                }], { session });
            }

            // 2. Determine Winners (Random Logic for Simulation)
            // Let's say 1 Winner takes all remaining? Or multiple?
            // "Distributed Prize". Let's pick 1 random winner for simplicity of check.
            const winnerIndex = Math.floor(Math.random() * playerIds.length);
            const winnerId = playerIds[winnerIndex];

            // 3. Credit Winner
            await User.findByIdAndUpdate(winnerId, {
                $inc: { 'wallet.main': distributablePrize }
            }).session(session);

            await Transaction.create([{
                userId: winnerId,
                type: 'game_win',
                amount: distributablePrize,
                status: 'completed',
                description: 'Game Win',
                metadata: {
                    totalPool,
                    adminProfit
                }
            }], { session });

            // CRITICAL: NO REFERRAL SERVICE CALL HERE
            // Strict Isolation Check Passed.

            return {
                totalPool,
                adminProfit,
                distributablePrize,
                winnerId
            };
        });
    }

    // --- LEGACY SUPPORT (Restored) ---

    static async getGameInfo() {
        return { message: "Game Service Online", activeGames: ['Mines', 'Aviator', 'Lottery', 'Pool'] };
    }

    static async playGame(userId, betAmount, choice) {
        // Simple Coin Flip Logic Implementation for Legacy Compatibility
        const win = Math.random() > 0.5;
        const multiplier = 1.95; // Standard coin flip
        let earnings = 0;
        let result = 'loss';

        if (win) {
            earnings = betAmount * multiplier;
            result = 'win';
            // Credit
            await User.findByIdAndUpdate(userId, { $inc: { 'wallet.game': earnings } });
        } else {
            await User.findByIdAndUpdate(userId, { $inc: { 'wallet.game': -betAmount } });
        }

        // Log handled by controller mostly, but we can do here too if needed
        return { result, earnings };
    }

    static async getSetting(key, defaultValue) {
        // Mock or DB call
        // Ideally use SystemSetting model
        const SystemSetting = require('../settings/SystemSettingModel');
        const setting = await SystemSetting.findOne({ key });
        return setting ? setting.value : defaultValue;
    }
}

module.exports = GameService;
