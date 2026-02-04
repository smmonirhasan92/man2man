const { User, Wallet, Transaction } = require('../models');

async function debugUserBalance() {
    try {
        console.log('--- Debugging User Balances ---');
        // Finds the user from the screenshot 'user-333333' or just lists recently active users
        const users = await User.findAll({
            include: [{ model: Wallet }],
            limit: 5,
            order: [['updatedAt', 'DESC']]
        });

        for (const user of users) {
            console.log(`\nUser: ${user.username} (ID: ${user.id})`);
            console.log(`User Model -> Income: ${user.income_balance}, Purchase: ${user.purchase_balance}`);
            if (user.Wallet) {
                console.log(`Legacy Wallet -> Balance: ${user.Wallet.balance}`);
            } else {
                console.log('Legacy Wallet -> None');
            }

            // Check recent transactions
            const transactions = await Transaction.findAll({
                where: { userId: user.id },
                limit: 5,
                order: [['createdAt', 'DESC']]
            });
            console.log('Recent 5 Transactions:');
            transactions.forEach(t => {
                console.log(` - [${t.type}] Amount: ${t.amount}, Status: ${t.status}, Time: ${t.createdAt}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugUserBalance();
