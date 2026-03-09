const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        const purgeScript = `
        const databases = ['man2man', 'universal_game_core_v1'];
        databases.forEach(dbName => {
            const currDb = db.getSiblingDB(dbName);
            print('\\n--- Purging ' + dbName + ' ---');
            
            const admins = currDb.users.find({ role: 'super_admin' }).toArray();
            if (admins.length === 0) {
                print('SKIP: No Super Admin in ' + dbName + '. Safety abort.');
                return;
            }
            
            const adminIds = admins.map(u => u._id);
            print('Found ' + adminIds.length + ' Super Admin(s).');

            // 1. Delete all other users
            const uDelete = currDb.users.deleteMany({ _id: { $nin: adminIds } });
            print('🗑️ Deleted ' + uDelete.deletedCount + ' non-admin users.');

            // 2. Wipe ALL other non-system collections
            const cols = currDb.getCollectionNames();
            cols.forEach(col => {
                if (col !== 'users' && !col.startsWith('system.')) {
                    const res = currDb.getCollection(col).deleteMany({});
                    print('🔥 Wiped ' + col + ': ' + res.deletedCount);
                }
            });

            // 3. Reset Admin Stats
            currDb.users.updateMany({ role: 'super_admin' }, { 
                $set: { 
                    referralCount: 0, 
                    referralIncome: 0, 
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
                    'taskData.tasksCompletedToday': 0,
                    'taskData.lastTaskDate': null,
                    activePlanId: null
                } 
            });
            print('✨ Reset Admin accounts in ' + dbName);
        });
        `;

        console.log('Uploading purge script...');
        await ssh.execCommand("echo '" + purgeScript.replace(/'/g, "'\\''") + "' > /tmp/purge_native.js");

        console.log('Executing native mongosh purge...');
        const res = await ssh.execCommand('mongosh /tmp/purge_native.js --quiet');

        console.log('--- MONGOSH OUTPUT ---');
        console.log(res.stdout);
        if (res.stderr) console.log('--- ERRORS ---\n', res.stderr);

        console.log('\n--- VERIFICATION ---');
        const verifyRes = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.users.find({}, {username: 1}).toArray()" --quiet');
        console.log('Surviving users in universal_game_core_v1:', verifyRes.stdout.trim());

    } catch (e) {
        console.error('Execution Error:', e);
    } finally {
        ssh.dispose();
    }
}

run();
