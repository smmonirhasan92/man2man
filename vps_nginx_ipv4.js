const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nginxIPv4() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- UPDATING NGINX PROXY TO IPv4 ---');
        // Use a more robust sed or just write the file
        const configPath = '/etc/nginx/sites-enabled/man2man';
        const res = await ssh.execCommand(`cat ${configPath}`);
        let config = res.stdout;
        
        if (config.includes('localhost:5050')) {
            config = config.replace(/localhost:5050/g, '127.0.0.1:5050');
            await ssh.execCommand(`echo "${config.replace(/"/g, '\\"')}" > ${configPath}`);
            console.log('Nginx config updated to 127.0.0.1:5050');
        } else {
            console.log('Config already used 127.0.0.1 or was different.');
        }

        console.log('Reloading Nginx...');
        await ssh.execCommand('nginx -s reload');
        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nginxIPv4();
