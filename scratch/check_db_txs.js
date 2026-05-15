const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/man2man', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const db = mongoose.connection.db;
        const txs = await db.collection('transactions').find({
            status: { $in: ['pending', 'pending_instructions', 'awaiting_payment', 'final_review'] }
        }).sort({ createdAt: -1 }).limit(5).toArray();

        console.log(JSON.stringify(txs, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
