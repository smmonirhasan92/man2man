const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else if (fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walkDir(path.join(__dirname, '../modules'));

let updatedFilesCount = 0;
let updatedLinesCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    const regex = /\]\s*,\s*\{\s*session\s*\}\s*\)/g;
    content = content.replace(regex, '], { session, ordered: true })');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf-8');
        updatedFilesCount++;
        const matches = originalContent.match(regex);
        updatedLinesCount += matches ? matches.length : 0;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Done. Updated ${updatedFilesCount} files, ${updatedLinesCount} replacements.`);
