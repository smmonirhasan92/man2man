
// Withdraw Game Funds (Game -> Main)
exports.withdrawGameFunds = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { amount } = req.body;
        const userId = req.user.user.id;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findByPk(userId, { include: [{ model: Wallet }], transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: 'User not found' });
        }

        if (parseFloat(user.game_balance) < parsedAmount) {
            await t.rollback();
            return res.status(400).json({ message: 'Insufficient Game Balance' });
        }

        // Deduct from Game Wallet
        user.game_balance = parseFloat(user.game_balance) - parsedAmount;
        await user.save({ transaction: t });

        // Credit Main Wallet
        if (!user.Wallet) {
            // Should verify wallet exists, usually created at registration
            await t.rollback();
            return res.status(500).json({ message: 'Main Wallet not found' });
        }
        user.Wallet.balance = parseFloat(user.Wallet.balance) + parsedAmount;
        await user.Wallet.save({ transaction: t });

        // Log Transaction
        await Transaction.create({
            userId,
            type: 'cash_out', // or 'game_withdraw'
            amount: parsedAmount,
            status: 'completed',
            description: 'Withdrawal from Game Wallet',
            recipientDetails: 'Self Transfer'
        }, { transaction: t });

        await t.commit();

        res.json({
            success: true,
            message: 'Winnings transferred to Main Wallet',
            newMainBalance: user.Wallet.balance,
            newGameBalance: user.game_balance
        });

    } catch (err) {
        await t.rollback();
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
