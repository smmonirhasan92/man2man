const mongoose = require('mongoose');

mongoose.connect('mongodb://m2m-mongodb:27017/man2man')
    .then(async () => {
        const db = mongoose.connection.db;

        // 1. Total Minted
        const mintedCursor = await db.collection('transactionledgers').aggregate([
            { $match: { type: { $in: ['mint', 'admin_adjustment'] }, amount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        const totalMinted = mintedCursor[0] ? mintedCursor[0].total : 0;

        // 2. Find Minted Money for Deleted Users vs Active Users
        const allMints = await db.collection('transactionledgers').find({
            type: { $in: ['mint', 'admin_adjustment'] }, 
            amount: { $gt: 0 }
        }).toArray();

        let mintedToDeletedUsers = 0;
        let mintedToActiveUsers = 0;

        for (let mint of allMints) {
            const userExists = await db.collection('users').findOne({ _id: mint.userId });
            if (!userExists) {
                mintedToDeletedUsers += mint.amount;
            } else {
                mintedToActiveUsers += mint.amount;
            }
        }

        console.log(`=== MINTING AUDIT REPORT ===`);
        console.log(`Total Minted Record: ${totalMinted} NXS`);
        console.log(`Minted to ACTIVE Users: ${mintedToActiveUsers} NXS`);
        console.log(`Minted to DELETED Users: ${mintedToDeletedUsers} NXS`);
        
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
