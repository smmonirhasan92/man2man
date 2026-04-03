const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testLoad() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = `
try {
    console.log('--- Attempting to load Support Routes ---');
    const routes = require('./routes/supportRoutes');
    console.log('SUCCESS: Module loaded successfully');
} catch (e) {
    console.log('FAIL: ' + e.message);
    console.log(e.stack);
}
`;
        await ssh.execCommand(`echo "${script}" > /var/www/man2man/backend/test_load_routes.js`);
        const res = await ssh.execCommand('node test_load_routes.js', { cwd: '/var/www/man2man/backend' });
        console.log("STDOUT:\n", res.stdout);
        console.log("STDERR:\n", res.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
testLoad();
