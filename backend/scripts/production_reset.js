const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function reset() {
    const dbs = ['man2man', 'universal_game_core_v1'];

    for (const dbName of dbs) {
        try {
            const uri = `mongodb://127.0.0.1:27017/${dbName}`;
            await mongoose.connect(uri);
            console.log(`\n--- Purging Database: ${dbName} ---`);

            // 1. Identify Super Admin to preserve
            const superAdmins = await mongoose.connection.db.collection('users').find({ role: 'super_admin' }).toArray();
            if (superAdmins.length === 0) {
                console.warn(`WARNING: No Super Admin found in ${dbName}. Skipping user purge for safety.`);
            } else {
                const superAdminIds = superAdmins.map(u => u._id);
                console.log(`Preserving ${superAdminIds.length} Super Admin(s).`);

                // 2. Delete all other users
                const userDelete = await mongoose.connection.db.collection('users').deleteMany({ _id: { $nin: superAdminIds } });
                console.log(`Deleted ${userDelete.deletedCount} non-admin users.`);
            }

            // 3. Clear all transactional/activity collections
            const collectionsToClear = [
                'lotteryslots', 'userplans', 'gamelogs', 'gamewallets',
                'transactions', 'notifications', 'supportmessages',
                'p2porders', 'system_logs', 'transactionledgers',
                'p2ptrades', 'p2pmessages', 'taskads'
            ];

            for (const col of collectionsToClear) {
                const result = await mongoose.connection.db.collection(col).deleteMany({});
                console.log(`Cleared collection '${col}': ${result.deletedCount} records.`);
            }

            // 4. Reset Super Admin balances
            if (superAdmins.length > 0) {
                const walletReset = await mongoose.connection.db.collection('users').updateMany(
                    { role: 'super_admin' },
                    {
                        $set: {
                            'wallet.main': 0,
                            'wallet.income': 0,
                            'wallet.p2p_locked': 0,
                            referralCount: 0,
                            activePlanId: null
                        }
                    }
                );
                console.log(`Reset wallets for ${walletReset.modifiedCount} Super Admins.`);
            }

            await mongoose.disconnect();
            console.log(`--- Purge of ${dbName} Complete ---`);

        } catch (err) {
            console.error(`ERROR during reset of ${dbName}:`, err);
            if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
        }
    }
}

// Security confirmation check could be added here if run interactively
reset();
