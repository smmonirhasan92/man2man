async function diagnose() {
    const users = await db.users.countDocuments();
    const wallets = await db.users.aggregate([
        { $group: { _id: null, main: { $sum: "$wallet.main" }, game: { $sum: "$wallet.game" } } }
    ]).toArray();
    
    const txTypes = await db.transactions.distinct("type");
    const ledgerTypes = await db.transactionledgers.distinct("type");
    
    const totalMinted = await db.transactionledgers.aggregate([
        { $match: { type: { $in: ['mint', 'admin_adjustment'] }, amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();

    const lastGames = await db.transactions.find({ 
        type: { $in: ['game_win', 'game_loss', 'crash_win', 'crash_loss', 'bet'] } 
    }).sort({ createdAt: -1 }).limit(5).toArray();

    print(JSON.stringify({
        users,
        wallets,
        txTypes,
        ledgerTypes,
        totalMinted,
        lastGames
    }, null, 2));
}
diagnose();
