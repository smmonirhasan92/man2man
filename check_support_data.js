const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkSupportData() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Support Messages Count ---");
        const count = await ssh.execCommand('mongosh universal_game_core_v1 --quiet --eval "db.supportmessages.countDocuments()"');
        console.log("Count:", count.stdout.trim());

        console.log("--- Recent Support Messages (Last 5) ---");
        const recent = await ssh.execCommand('mongosh universal_game_core_v1 --quiet --eval "JSON.stringify(db.supportmessages.find().sort({createdAt: -1}).limit(5).toArray())"');
        console.log(recent.stdout);

        console.log("--- Checking for any 'open' status tickets ---");
        const openTickets = await ssh.execCommand('mongosh universal_game_core_v1 --quiet --eval "db.supportmessages.countDocuments({status: \'open\'})"');
        console.log("Open Tickets:", openTickets.stdout.trim());

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkSupportData();
