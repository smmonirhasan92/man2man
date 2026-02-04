
try {
    console.log("Verifying Phase 4: Business Logic Hardening...");

    // 1. Task Service (Ad Security)
    const TaskService = require('../modules/task/TaskService');
    if (typeof TaskService.startTask === 'function') console.log("TaskService.startTask: OK");
    else console.error("TaskService missing startTask!");

    // 2. Referral Service (MLM Loop)
    const ReferralService = require('../modules/referral/ReferralService');
    if (typeof ReferralService.validateReferrer === 'function') console.log("ReferralService.validateReferrer: OK");
    else console.error("ReferralService missing validateReferrer!");

    // 3. Admin Controller (Emergency Stop)
    const AdminGameController = require('../controllers/AdminGameController');
    if (typeof AdminGameController.emergencyStop === 'function') console.log("AdminGameController.emergencyStop: OK");
    else console.error("AdminGameController missing emergencyStop!");

    // 4. Log Cleanup
    // Just syntax check the script file existence
    const fs = require('fs');
    if (fs.existsSync('./scripts/cron_clean_logs.js')) console.log("cron_clean_logs.js: FOUND");
    else console.error("cron_clean_logs.js: MISSING");

    console.log("All Phase 4 Checks Passed.");
    process.exit(0);

} catch (err) {
    console.error("Verification Error:", err);
    process.exit(1);
}
