const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function checkFiles(dir) {
    walkDir(dir, function(filePath) {
        if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('useEffect(') || content.includes('useEffect ()')) {
            if (!content.includes('import {') || !content.includes('useEffect') || !content.includes('react')) {
                // Simplistic check, looking for 'useEffect' inside the imports
                const imports = content.match(/import .* from ['"]react['"]/g);
                if (!imports || !imports.some(i => i.includes('useEffect'))) {
                    console.log("MAYBE MISSING IMPORT IN:", filePath);
                }
            }
        }
    });
}

console.log("Scanning...");
checkFiles('d:\\man2man\\frontend\\app');
checkFiles('d:\\man2man\\frontend\\components');
console.log("Done.");
