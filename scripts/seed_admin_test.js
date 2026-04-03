const { Client } = require('ssh2');

// Step 1: Create the seed js file on the server, then execute it
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');
    
    // Create the JS seed file on the VPS host first
    const writeCmd = `cat > /tmp/seed_admin.js << 'MONGOEOF'
db = db.getSiblingDB('universal_game_core_docker');
var r = db.users.updateOne(
  { primary_phone: '01700000000' },
  { $set: { primary_phone: '01700000000', fullName: 'Super Admin', role: 'admin', status: 'active' } },
  { upsert: true }
);
print('Result - Upserted: ' + r.upsertedCount + ', Modified: ' + r.modifiedCount);
db.users.find({ role: 'admin' }, { fullName: 1, role: 1, primary_phone: 1 }).forEach(printjson);
MONGOEOF
docker cp /tmp/seed_admin.js m2m-mongodb-test:/tmp/seed_admin.js && docker exec m2m-mongodb-test mongosh mongodb://localhost:27017 /tmp/seed_admin.js`;
    
    conn.exec(writeCmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('close', (code) => {
            console.log('Exit code:', code);
            conn.end();
        })
        .on('data', d => process.stdout.write(d))
        .stderr.on('data', d => process.stderr.write(d));
    });
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 30000
});
