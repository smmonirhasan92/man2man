const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function configureReplicaSet() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        console.log('Step 1: Backup and Modify mongod.conf');
        // Check if replication is already there to avoid duplicates
        const checkConf = await ssh.execCommand('cat /etc/mongod.conf');
        if (checkConf.stdout.includes('replSetName')) {
            console.log('Replica Set already configured in mongod.conf');
        } else {
            const updateConf = `cp /etc/mongod.conf /etc/mongod.conf.bak && echo "replication:\n  replSetName: \"rs0\"" >> /etc/mongod.conf`;
            await ssh.execCommand(updateConf);
            console.log('Config updated. Restarting MongoDB...');
            await ssh.execCommand('systemctl restart mongod');
        }

        console.log('Step 2: Initialize Replica Set');
        // Wait a few seconds for MongoDB to start
        await new Promise(r => setTimeout(r, 5000));
        const initResult = await ssh.execCommand('mongosh --eval "rs.initiate()" || mongo --eval "rs.initiate()"');
        console.log('Init Result:', initResult.stdout || initResult.stderr);

        console.log('Step 3: Verify Status');
        const statusResult = await ssh.execCommand('mongosh --eval "rs.status()" || mongo --eval "rs.status()"');
        console.log('Status Result:', statusResult.stdout.includes('PRIMARY') ? 'SUCCESS: PRIMARY' : 'CHECK LOGS');

        ssh.dispose();
    } catch (err) {
        console.error('Operation Failed:', err);
        ssh.dispose();
    }
}
configureReplicaSet();
