const WalletService = require('../wallet/WalletService');
const GameLog = require('./GameLogModel'); // Ensure this model exists or use a generic one

class CoinFlipService {

    /**
     * Play Coin Flip
     * @param {string} userId 
     * @param {number} betAmount 
     * @param {string} choice 'head' or 'tail'
     */
    async play(userId, betAmount, choice) {
        // 1. Validation
        if (!betAmount || betAmount < 10) throw new Error("Minimum bet is 10 BDT");
        if (!['head', 'tail'].includes(choice)) throw new Error("Invalid choice");

        // 2. Deduct Balance (Atomic)
        const deduction = await WalletService.deductBalance(userId, betAmount, 'game_bet', 'Coin Flip Entry');
        if (!deduction.success) {
            throw new Error(deduction.message || "Insufficient Balance");
        }

        // 3. Game Logic (RNG)
        // 50/50 Chance
        const isWin = Math.random() < 0.5;
        const resultSide = isWin ? choice : (choice === 'head' ? 'tail' : 'head');

        let winAmount = 0;
        let newBalance = deduction.newBalance; // Start with balance after deduction

        if (isWin) {
            winAmount = betAmount * 2; // 2x Multiplier
            const credit = await WalletService.addBalance(userId, winAmount, 'game_win', 'Coin Flip Win');
            newBalance = credit.newBalance;
        }

        // 4. Async Logging (Non-blocking)
        this.logGame(userId, betAmount, choice, resultSide, isWin, winAmount).catch(console.error);

        return {
            won: isWin,
            result: resultSide,
            winAmount: winAmount,
            newBalance: newBalance
        };
    }

    async logGame(userId, bet, choice, result, won, winAmount) {
        try {
            // Check if GameLogModel exists, otherwise skip or use a generic log
            // Assuming GameLogModel is available based on previous context
            await GameLog.create({
                userId,
                gameType: 'coin_flip',
                betAmount: bet,
                multiplier: 2.0,
                winAmount: winAmount,
                status: won ? 'win' : 'loss',
                details: { choice, result }
            });
        } catch (e) {
            console.error("Game Log Error:", e.message);
        }
    }
}

module.exports = new CoinFlipService();
