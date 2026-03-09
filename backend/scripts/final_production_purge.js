const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from parent dir
dotenv.config({ path: path.join(__dirname, '../.env') });

async function purgeAll() {
    const dbs = ['man2man', 'universal_game_core_v1'];

    for (const dbName of dbs) {
        let connection;
        try {
            const uri = `mongodb://127.0.0.1:27017/${dbName}`;
            console.log(`\n🚀 INITIATING PURGE FOR: ${dbName} 🚀`);

            connection = await mongoose.createConnection(uri).asPromise();
            console.log(`✅ Connected to ${dbName}`);

            const collections = await connection.db.listCollections().toArray();
            const colNames = collections.map(c => c.name);
            console.log(`Detected collections: ${colNames.join(', ')}`);

            // 1. Identify Super Admins
            const usersCol = connection.collection('users');
            const superAdmins = await usersCol.find({ role: 'super_admin' }).toArray();

            if (superAdmins.length === 0) {
                console.warn(`[SKIP] No Super Admin found in ${dbName}. Preservation safety check failed.`);
            } else {
                console.log(`Found ${superAdmins.length} Super Admin(s): ${superAdmins.map(u => u.username).join(', ')}`);

                // Keep these IDs
                const superAdminIds = superAdmins.map(u => u._id);

                // Delete ALL other users
                const userPurge = await usersCol.deleteMany({ _id: { $nin: superAdminIds } });
                console.log(`🗑️ Deleted ${userPurge.deletedCount} non-admin users.`);

                // Reset Admin Wallets
                const walletReset = await usersCol.updateMany(
                    { role: 'super_admin' },
                    {
                        $set: {
                            wallet: {
                                main: 0,
                                income: 0,
                                purchase: 0,
                                escrow_locked: 0,
                                agent: 0,
                                commission: 0,
                                pending_referral: 0,
                                turnover: { required: 0, completed: 0 }
                            },
                            referralCount: 0,
                            referralIncome: 0,
                            'taskData.tasksCompletedToday': 0,
                            'taskData.lastTaskDate': null,
                            activePlanId: null
                        }
                    }
                );
                console.log(`💰 Reset wallets/stats for ${walletReset.modifiedCount} Super Admins.`);
            }

            // 2. Wipe ALL OTHER transactional/activity collections
            const colsToWipe = colNames.filter(name => name !== 'users' && name !== 'system.indexes' && !name.startsWith('system.'));

            for (const colName of colsToWipe) {
                const wipeRes = await connection.collection(colName).deleteMany({});
                console.log(`🔥 Wiped collection '${colName}': ${wipeRes.deletedCount} records.`);
            }

            console.log(`✨ Purge of ${dbName} successfully completed. ✨`);

        } catch (err) {
            console.error(`❌ FAILED to purge ${dbName}:`, err);
        } finally {
            if (connection) await connection.close();
        }
    }
    process.exit(0);
}

purgeAll();
