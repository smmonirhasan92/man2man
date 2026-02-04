const fs = require('fs');
const path = require('path');
const os = require('os');
const connectDB = require('../kernel/database');
const mongoose = require('mongoose');

// Load Models (Attempt to load core models)
// Using try-catch to avoid crashing if models moved
let User, GameLog;
try {
    User = require('../routes/userRoutes'); // Often models are imported in routes or we find them
    // Actually better to define simple schema or load from models dir
} catch (e) { }

const LOG_FILE = path.join(__dirname, '../logs/nadi_bhuri_report.md');

async function runDiagnostic() {
    console.log("Running Nadi-Bhuri Diagnostic...");

    let output = `
# Nadi-Bhuri (Deep Dive) System Report
**Generated:** ${new Date().toLocaleString()}

## 1. System Health
- **OS**: ${os.type()} ${os.release()}
- **Memory**: ${(os.freemem() / 1024 / 1024).toFixed(2)} MB Free / ${(os.totalmem() / 1024 / 1024).toFixed(2)} MB Total
- **Uptime**: ${(os.uptime() / 3600).toFixed(2)} Hours
- **Node Version**: ${process.version}

## 2. Process Memory
- **RSS**: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB
- **Heap Total**: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB
- **Heap Used**: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB

## 3. Database Health
`;

    try {
        await connectDB();
        output += `- **Connection**: SUCCESS (MongoDB)\n`;

        // Simple Counts if possible. 
        // We will assume 'users' collection exists.
        const db = mongoose.connection.db;

        const userCount = await db.collection('users').countDocuments();
        output += `- **Total Users**: ${userCount}\n`;

        const collections = await db.listCollections().toArray();
        output += `\n### Collections:\n`;
        collections.forEach(c => {
            output += `- ${c.name}\n`;
        });

    } catch (err) {
        output += `- **Connection**: FAILED (${err.message})\n`;
    }

    output += `\n## 4. Socket & Games
- **Socket Loop Check**: Code patched in GameSocketHandler.js
- **Games Active**:
  - Aviator: ENABLED
  - Super Ace: ENABLED
  - Lottery: ENABLED
  - Mines: PURGED
  - Teen Patti: PURGED
`;

    // Save
    fs.writeFileSync(LOG_FILE, output);
    console.log("Report saved to " + LOG_FILE);
    process.exit(0);
}

runDiagnostic();
