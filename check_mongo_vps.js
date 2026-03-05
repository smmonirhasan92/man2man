const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function checkMongo() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        console.log("--- MONGO RS STATUS ---");
        const r1 = await ssh.execCommand('mongosh --eval "rs.status()"');
        console.log(r1.stdout);
        console.log(r1.stderr);

        console.log("--- MONGO DB STATS ---");
        const r2 = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.stats()"');
        console.log(r2.stdout);

        console.log("--- USERS COUNT ---");
        const r3 = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.users.countDocuments()"');
        console.log(r3.stdout);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkMongo();
