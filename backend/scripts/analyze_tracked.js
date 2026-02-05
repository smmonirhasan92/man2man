const fs = require('fs');

try {
    const data = fs.readFileSync('tracked_files.txt', 'ucs2'); // UTF-16LE
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    console.log(`Checking sizes for ${lines.length} tracked files...`);

    const fileSizes = [];

    lines.forEach(filePath => {
        try {
            const stat = fs.statSync(filePath);
            fileSizes.push({ path: filePath, size: stat.size });
        } catch (err) {
            // File might be deleted or path issue
        }
    });

    // Sort by size desc
    fileSizes.sort((a, b) => b.size - a.size);

    let report = '--- TOP 50 LARGEST TRACKED FILES ---\n';
    fileSizes.slice(0, 50).forEach(f => {
        report += `${(f.size / 1024 / 1024).toFixed(2)} MB  - ${f.path}\n`;
    });

    const totalSize = fileSizes.reduce((acc, f) => acc + f.size, 0);
    report += `\nTotal Tracked Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`;

    fs.writeFileSync('size_report.txt', report, 'utf8');
    console.log('Report saved to size_report.txt');

} catch (e) {
    console.error(e.message);
}
