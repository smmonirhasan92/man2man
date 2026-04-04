/**
 * ONE-CLICK DEPLOYMENT SCRIPT
 * Usage: node deploy.js "Your commit message"
 */
const { execSync } = require('child_process');
const path = require('path');

const commitMsg = process.argv[2] || "Auto-deploy update";
const sshRunnerPath = path.join(__dirname, 'scripts', 'ssh_runner.js');

try {
    console.log('🚀 Step 1: Syncing Local Code to GitHub...');
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });

    console.log('\n🚢 Step 2: Deploying to VPS Server...');
    // This calls our established SSH runner to pull and rebuild
    const remoteCmd = "cd /var/www/man2man && git pull origin main && docker compose -f docker-compose.test.yml up -d --build m2m-frontend-test m2m-backend-test";
    execSync(`node "${sshRunnerPath}" "${remoteCmd}"`, { stdio: 'inherit' });

    console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
} catch (error) {
    console.error('\n❌ Deployment Failed:', error.message);
    process.exit(1);
}
