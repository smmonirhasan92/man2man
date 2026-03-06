const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('node-ssh');

async function setupVapid() {
    const vapidKeys = webpush.generateVAPIDKeys();
    const backendEnvString = `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_EMAIL=admin@man2man.host\n`;
    const frontendEnvString = `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`;

    // --- Local Backend ---
    const localBackendEnv = path.join(__dirname, '.env');
    fs.appendFileSync(localBackendEnv, backendEnvString);
    console.log("Appended VAPID keys to local backend .env");

    // --- Local Frontend ---
    const localFrontendEnv = path.join(__dirname, '../frontend/.env.local');
    if (fs.existsSync(localFrontendEnv)) {
        fs.appendFileSync(localFrontendEnv, frontendEnvString);
        console.log("Appended VAPID keys to local frontend .env.local");
    } else {
        fs.writeFileSync(localFrontendEnv, frontendEnvString);
    }

    const localFrontendProdEnv = path.join(__dirname, '../frontend/.env.production');
    if (fs.existsSync(localFrontendProdEnv)) {
        fs.appendFileSync(localFrontendProdEnv, frontendEnvString);
    } else {
        fs.writeFileSync(localFrontendProdEnv, frontendEnvString);
    }
    console.log("Appended VAPID keys to local frontend .env.production");

    // --- Remote VPS ---
    const ssh = new NodeSSH();
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        // Append to remote backend
        const remoteBackendEnv = `/var/www/man2man/backend/.env`;
        await ssh.execCommand(`echo "${backendEnvString.trim().replace(/\n/g, '\\n')}" >> ${remoteBackendEnv}`);
        console.log("Appended to remote backend .env");

        // Append to remote frontend env
        const remoteFrontendEnv = `/var/www/man2man/frontend/.env.production`;
        await ssh.execCommand(`echo "${frontendEnvString.trim()}" >> ${remoteFrontendEnv}`);
        console.log("Appended to remote frontend .env.production");

        // Restart remote pm2 processes
        const r2 = await ssh.execCommand('pm2 restart all', { cwd: '/var/www/man2man' });
        console.log("Restarted PM2 all processes on remote server.");

        // Rebuild frontend might be needed forNEXT_PUBLIC variables, but we can do that via Next.js deployment later.
        console.log("NOTE: Frontend requires a rebuild (npm run build) to bake in NEXT_PUBLIC_ variables. Will do that during the next deployment.");

    } catch (e) {
        console.error("SSH Error:", e);
    } finally {
        ssh.dispose();
    }
}

setupVapid();
