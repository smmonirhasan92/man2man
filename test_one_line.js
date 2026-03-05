const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function execTest() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const testScript = "require('dotenv').config(); const mongoose=require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(async ()=>{ const P2P=require('./modules/p2p/P2PService'); const stats=await P2P.getMarketSummary(); console.log('==> API RESPONSE:', JSON.stringify(stats)); process.exit(0); }).catch(e=>console.log(e));";
        const r2 = await ssh.execCommand(\`node -e "\${testScript}"\`, {cwd: '/var/www/man2man/backend'});
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch(err) {
        console.log(err);
    }
}
execTest();
