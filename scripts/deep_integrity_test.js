const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepDiag() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const paths = [
            '/var/www/man2man/backend/server.js',
            '/var/www/man2man/backend/routes/supportRoutes.js',
            '/var/www/man2man/backend/controllers/supportController.js',
            '/var/www/man2man/backend/modules/support/SupportMessageModel.js'
        ];

        console.log("--- File Existence & Permissions ---");
        for (const p of paths) {
            const res = await ssh.execCommand(`ls -lh ${p}`);
            console.log(res.stdout || `NOT FOUND: ${p}`);
        }

        console.log("\n--- Integrity Check (MD5) ---");
        for (const p of paths) {
            const res = await ssh.execCommand(`md5sum ${p}`);
            console.log(res.stdout || `FAILED: ${p}`);
        }

        console.log("\n--- Node Resolve Test (Absolute) ---");
        const script = "try { console.log('Resolved:', require.resolve('/var/www/man2man/backend/routes/supportRoutes.js')); } catch(e) { console.log('Error:', e.message); }";
        const res = await ssh.execCommand(`node -e "${script}"`);
        console.log(res.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
deepDiag();
