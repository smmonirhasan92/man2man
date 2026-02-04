const fs = require('fs');
const path = require('path');

const modules = [
    '../modules/history/HistoryLogService',
    '../controllers/historyController',
    '../routes/historyRoutes',
    '../modules/bonus/HoldingBonusService',
    '../modules/wallet/WithdrawalService',
    '../controllers/walletController',
    '../routes/walletRoutes'
];

console.log("Starting Debug Require...");

modules.forEach(m => {
    try {
        const p = path.join(__dirname, m);
        console.log(`Requiring: ${m} (${p})`);
        require(m);
        console.log(`✅ Success: ${m}`);
    } catch (e) {
        console.error(`❌ FAILED: ${m}`);
        console.error(e);
    }
});

console.log("Done.");
