const { MongoClient } = require('mongodb');

async function userAudit() {
    const uri = 'mongodb://127.0.0.1:27017/universal_game_core_v1?replicaSet=rs0';
    const client = new MongoClient(uri, { directConnection: true });

    try {
        await client.connect();
        const db = client.db('universal_game_core_v1');

        // Find both users by phone or username
        const targets = await db.collection('users').find({
            $or: [
                { username: { $regex: /mos|naz/i } },
                { phone: { $in: ['+8801958507831', '+8801727265007'] } },
                { primary_phone: { $in: ['+8801958507831', '+8801727265007'] } }
            ]
        }).toArray();

        console.log(`Found ${targets.length} users to audit\n`);

        for (const user of targets) {
            console.log(`\n========================================`);
            console.log(`USER: ${user.username || user.fullName}`);
            console.log(`Phone: ${user.phone || user.primary_phone}`);
            console.log(`Current Balance: ${user.wallet?.main} NXS`);
            console.log(`----------------------------------------`);

            // Get all transactions
            const txns = await db.collection('transactions').find(
                { userId: user._id },
                { sort: { createdAt: 1 } }
            ).toArray();

            let totalIn = 0, totalOut = 0, totalFee = 0;

            for (const t of txns) {
                const amt = t.amount || 0;
                const sign = amt > 0 ? '+' : '';
                console.log(`  [${t.type}] ${sign}${amt} NXS | status:${t.status} | ${t.description || ''}`);
                
                if (t.type === 'fee') totalFee += Math.abs(amt);
                else if (amt > 0) totalIn += amt;
                else totalOut += Math.abs(amt);
            }

            console.log(`----------------------------------------`);
            console.log(`  Total IN: +${totalIn.toFixed(2)} NXS`);
            console.log(`  Total OUT: -${totalOut.toFixed(2)} NXS`);
            console.log(`  Fees Paid: ${totalFee.toFixed(2)} NXS`);
            console.log(`  Expected Balance: ${(totalIn - totalOut - totalFee).toFixed(2)} NXS`);
            console.log(`  Actual Balance: ${user.wallet?.main} NXS`);
        }

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

userAudit();
