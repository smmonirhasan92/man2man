const fs = require('fs');
const path = require('path');

const dirs = [
    'd:/man2man/frontend/components',
    'd:/man2man/frontend/app',
    'd:/man2man/frontend/context'
];

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Replaces symbol, and string variations of TK and BDT
            let newContent = content
                .replace(/৳/g, '$')
                .replace(/ TK\b/g, ' USD')
                .replace(/ BDT\b/g, ' USD')
                .replace(/\bTK /g, 'USD ')
                .replace(/\bBDT /g, 'USD ')
                .replace(/ TK"/g, ' USD"')
                .replace(/ BDT"/g, ' USD"')
                .replace(/ TK</g, ' USD<')
                .replace(/ BDT</g, ' USD<')
                .replace(/ TK`/g, ' USD`')
                .replace(/ BDT`/g, ' USD`');

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

dirs.forEach(processDir);
console.log("Currency replacement script completed.");
