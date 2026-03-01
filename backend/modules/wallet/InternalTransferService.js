const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('./TransactionModel');
const logger = require('../../utils/logger'); // Assuming logger exists

class InternalTransferService {

    /**
     * Transfer funds between Main Wallet and Game Wallet
     * @param {string} userId 
     * @param {string} direction 'main_to_game' or 'game_to_main'
     * @param {number} amount 
     */
    static async transfer(userId, direction, amount) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            if (amount <= 0) throw new Error("Invalid transfer amount");

            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            // Define Source and Destination based on Direction
            let sourceWallet, destWallet, description;

            if (direction === 'main_to_game') {
                if ((user.wallet.main || 0) < amount) throw new Error("Insufficient Main Balance");
                user.wallet.main -= amount;
                user.wallet.game = (user.wallet.game || 0) + amount;
                description = "Transfer to Game Wallet";
            } else if (direction === 'game_to_main') {
                if ((user.wallet.game || 0) < amount) throw new Error("Insufficient Game Balance");
                user.wallet.game -= amount;
                user.wallet.main = (user.wallet.main || 0) + amount;
                description = "Transfer to Main Wallet";
            } else {
                throw new Error("Invalid direction");
            }

            await user.save({ session });

            // Create Transaction Log ([WALLET_SWAP])
            await Transaction.create([{
                userId,
                type: 'internal_transfer',
                amount: direction === 'main_to_game' ? -amount : amount, // Negative if leaving main? Or just track swap.
                // Standard: - amount usually means money leaving main. 
                // But this is internal. Let's just monitor flow.
                status: 'completed',
                description: `[WALLET_SWAP] ${description}`,
                recipientDetails: direction
            }], { session });

            await session.commitTransaction();

            logger.info(`[WALLET_SWAP] User ${userId} | ${direction} | Amount: ${amount}`);

            return {
                success: true,
                mainBalance: user.wallet.main,
                gameBalance: user.wallet.game
            };

        } catch (error) {
            await session.abortTransaction();
            logger.error(`Wallet Swap Failed: ${error.message}`);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = InternalTransferService;
