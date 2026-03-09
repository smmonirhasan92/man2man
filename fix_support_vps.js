const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');
const path = require('path');

async function fixVps() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const supportRoutesContent = fs.readFileSync('backend/routes/supportRoutes.js', 'utf8');
        const supportControllerContent = fs.readFileSync('backend/controllers/supportController.js', 'utf8');
        const supportModelContent = fs.readFileSync('backend/modules/support/SupportMessageModel.js', 'utf8');

        console.log("--- Force Writing Files to VPS ---");
        await ssh.execCommand(`mkdir -p /var/www/man2man/backend/routes /var/www/man2man/backend/controllers /var/www/man2man/backend/modules/support`);

        await ssh.execCommand(`cat << 'EOF' > /var/www/man2man/backend/routes/supportRoutes.js\n${supportRoutesContent}\nEOF`);
        await ssh.execCommand(`cat << 'EOF' > /var/www/man2man/backend/controllers/supportController.js\n${supportControllerContent}\nEOF`);
        await ssh.execCommand(`cat << 'EOF' > /var/www/man2man/backend/modules/support/SupportMessageModel.js\n${supportModelContent}\nEOF`);

        console.log("--- Verifying Rewrite ---");
        const res = await ssh.execCommand('ls -l /var/www/man2man/backend/routes/supportRoutes.js');
        console.log(res.stdout);

        console.log("--- Restarting Backend ---");
        await ssh.execCommand('pm2 restart man2man-backend');

        console.log("--- Checking Status ---");
        setTimeout(async () => {
            const status = await ssh.execCommand('pm2 status man2man-backend');
            console.log(status.stdout);
            ssh.dispose();
        }, 5000);

    } catch (e) { console.error(e); ssh.dispose(); }
}
fixVps();
