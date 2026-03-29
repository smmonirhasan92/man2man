const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function deployLuckTest() {
    console.log("🚀 Starting Zero-Hassle Direct Deployment...");
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });
        console.log("✅ SSH Connected Successfully.");

        // 1. Upload Backend Controller
        console.log("📤 Uploading SpinController.js...");
        await ssh.putFile(
            'd:\\man2man\\backend\\modules\\gamification\\SpinController.js',
            '/var/www/man2man/backend/modules/gamification/SpinController.js'
        );
        console.log("✅ SpinController.js Uploaded.");

        // 2. Upload Frontend Component
        console.log("📤 Uploading LuckTestClient.js...");
        await ssh.putFile(
            'd:\\man2man\\frontend\\components\\gamification\\LuckTestClient.js',
            '/var/www/man2man/frontend/components/gamification/LuckTestClient.js'
        );
        console.log("✅ LuckTestClient.js Uploaded.");

        // 3. Restart Backend
        console.log("🔄 Restarting Backend Service...");
        const resBackend = await ssh.execCommand('pm2 restart 0', { cwd: '/var/www/man2man/backend' });
        console.log("Backend PM2:", resBackend.stdout);

        // 4. Rebuild and Restart Frontend (Fast Next.js Build)
        console.log("🏗️ Rebuilding Frontend (This takes 1-2 minutes)...");
        const resFrontend = await ssh.execCommand('npm run build && pm2 restart 1 || pm2 restart man2man-frontend', { cwd: '/var/www/man2man/frontend' });
        console.log("Frontend Build:", resFrontend.stdout || resFrontend.stderr);

        console.log("🎉 DEPLOYMENT COMPLETE! The live site has been updated.");

    } catch (err) {
        console.error("❌ Deployment Failed:", err);
    } finally {
        ssh.dispose();
    }
}

deployLuckTest();
