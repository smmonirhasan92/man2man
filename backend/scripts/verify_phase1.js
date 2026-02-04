
try {
    console.log("Verifying Module Syntax...");
    require('../modules/game/GameSocketHandler.js');
    console.log("GameSocketHandler: OK");
    require('../modules/wallet/WithdrawalService.js');
    console.log("WithdrawalService: OK");
    require('../modules/task/TaskService.js');
    console.log("TaskService: OK");
    require('../modules/wallet/WalletService.js');
    console.log("WalletService: OK");
    console.log("All Syntax Checks Passed.");
} catch (err) {
    console.error("Syntax Error:", err);
    process.exit(1);
}
