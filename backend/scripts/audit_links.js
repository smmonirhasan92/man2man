const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5050'; // Assuming backend port
const FRONTEND_URL = 'http://localhost:3000'; // Assuming frontend port

const ROUTES_TO_CHECK = [
    '/api',
    '/api/auth/profile', // Likely 401 unauth, but exists
    '/api/game/aviator/state',
    '/api/game/super-ace/spin', // 401 or 400
    '/api/lottery/status',
    '/api/p2p/active'
];

// Mock Frontend Routes (Checking by file existence or assuming nextjs handles them)
// Since we can't easily curl nextjs pages without the server running and rendering, 
// we will focus on backend API routes transparency.

const LOG_FILE = path.join(__dirname, '../logs/nadi_bhuri_report.md');

async function audit() {
    let report = "# Link Scan Report\n\n";
    report += `Date: ${new Date().toISOString()}\n\n`;

    console.log("Starting Link Audit...");

    for (const route of ROUTES_TO_CHECK) {
        try {
            const url = `${BASE_URL}${route}`;
            const res = await axios.get(url, { validateStatus: () => true });

            report += `- **${route}**: ${res.status} ${res.statusText}\n`;
            console.log(`Checked ${route}: ${res.status}`);

            if (res.status === 404) {
                report += `  - [WARNING] Route not found!\n`;
            }
        } catch (err) {
            report += `- **${route}**: CONNECTION FAILED (${err.message})\n`;
        }
    }

    // Append to generic report or save new
    fs.appendFileSync(LOG_FILE, report);
    console.log("Audit Complete.");
}

// Ensure log dir exists
if (!fs.existsSync(path.join(__dirname, '../logs'))) {
    fs.mkdirSync(path.join(__dirname, '../logs'));
}

audit();
