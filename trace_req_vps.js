const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function trace() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const script = `
const tryReq = (path) => {
    try {
        require(path);
        console.log('OK: ' + path);
        return true;
    } catch (e) {
        console.log('FAIL: ' + path + ' -> ' + e.message);
        if (e.stack) {
             const lines = e.stack.split('\\n');
             console.log('   Stack: ' + lines[0]);
             console.log('   Stack: ' + lines[1]);
        }
        return false;
    }
};

process.chdir('/var/www/man2man/backend');
console.log('--- Tracing Dependencies ---');
if (tryReq('./modules/support/SupportMessageModel')) {
    if (tryReq('./controllers/supportController')) {
        tryReq('./routes/supportRoutes');
    }
}
`;
        const res = await ssh.execCommand(`node -e "${script}"`);
        console.log(res.stdout);
        console.log(res.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
trace();
