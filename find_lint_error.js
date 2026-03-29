const { execSync } = require('child_process');
try {
    console.log("Running ESLint...");
    execSync('npx eslint . --format json > eslint.json', { cwd: 'd:/man2man/frontend' });
} catch (e) {
    // Eslint returns non-zero if there are errors
}

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/man2man/frontend/eslint.json', 'utf8'));

for (const file of data) {
    for (const msg of file.messages) {
        if (msg.message.includes("'useEffect' is not defined") || msg.message.includes("no-undef")) {
            console.log("FOUND MISSING IMPORT IN:", file.filePath);
            console.log("Line:", msg.line, msg.message);
        }
    }
}
console.log("Done.");
