const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    // Check nginx config to see what port API is proxied to
    console.log('=== NGINX Config ===');
    const nginx = await ssh.execCommand('cat /etc/nginx/sites-enabled/default 2>/dev/null || cat /etc/nginx/sites-enabled/*.conf 2>/dev/null || cat /etc/nginx/nginx.conf | grep -A5 "proxy_pass"');
    console.log(nginx.stdout);

    // Check all ports
    console.log('\n=== All Listening Ports ===');
    const ports = await ssh.execCommand('ss -tlnp | grep LISTEN');
    console.log(ports.stdout);

    // Try curling backend directly
    console.log('\n=== Backend API test (port 5050) ===');
    const curl5050 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/api/auth/me');
    console.log('Port 5050:', curl5050.stdout);

    const curl5000 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me');
    console.log('Port 5000:', curl5000.stdout);

    const curl4000 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/auth/me');
    console.log('Port 4000:', curl4000.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
