const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MAX_AGE_DAYS = 30; // Delete files older than 30 days

async function cleanup() {
    console.log(`[CLEANUP] Starting Uploads Cleanup (Max Age: ${MAX_AGE_DAYS} days)...`);
    
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log("[CLEANUP] Uploads directory not found. Skipping.");
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;
    const now = Date.now();

    files.forEach(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Skip directories
        if (stats.isDirectory()) return;

        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        if (ageInDays > MAX_AGE_DAYS) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`[CLEANUP] Deleted: ${file} (Age: ${Math.floor(ageInDays)} days)`);
        }
    });

    console.log(`[CLEANUP] Finished. Deleted ${deletedCount} expired files.`);
}

cleanup();
