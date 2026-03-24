const { execSync } = require('child_process');

function forcePush() {
    try {
        console.log('--- Current Branch/Ref ---');
        console.log(execSync('git branch').toString());
        console.log(execSync('git rev-parse HEAD').toString());

        console.log('--- Committing everything just in case ---');
        try { execSync('git add .'); execSync('git commit -m "fix: v6.5 final push sync"'); } catch(e) { console.log('Nothing to commit'); }

        console.log('--- Pushing to main branch explicitly ---');
        const res = execSync('git push https://github.com/smmonirhasan92/man2man.git HEAD:main --force').toString();
        console.log(res);

        console.log('--- DONE ---');
    } catch (err) {
        console.error('Git Operation Failed:', err.stdout?.toString() || err.message);
    }
}
forcePush();
