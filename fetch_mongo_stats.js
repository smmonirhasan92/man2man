const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function fetchMongoStats() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        console.log("Saving outputs...");
        await ssh.execCommand('mongosh --eval "rs.status()" > /var/www/rs_status.txt');
        await ssh.execCommand('mongosh universal_game_core_v1 --quiet --eval "db.users.countDocuments()" > /var/www/users_count.txt');

        await ssh.getFile('d:\\man2man\\rs_status.txt', '/var/www/rs_status.txt');
        await ssh.getFile('d:\\man2man\\users_count.txt', '/var/www/users_count.txt');
        console.log("Outputs saved successfully.");
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
fetchMongoStats();
