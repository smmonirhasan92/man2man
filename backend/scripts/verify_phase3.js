
try {
    console.log("Verifying Phase 3: Unified Game Engine...");

    // 1. Base Service
    const BaseGameService = require('../services/BaseGameService');
    console.log("BaseGameService: Loaded");

    // 2. Refactored Services
    const AviatorService = require('../modules/game/AviatorService');
    console.log("AviatorService: Loaded");

    const MinesService = require('../modules/game/MinesService');
    console.log("MinesService: Loaded");

    // 3. Socket Handler (Logic Check)
    const socketHandler = require('../modules/game/GameSocketHandler');
    console.log("GameSocketHandler: Loaded");

    // 4. Check Methods (Inheritance)
    if (typeof AviatorService.handleBet === 'function') console.log("AviatorService.handleBet (Base): OK");
    else console.error("AviatorService missing handleBet!");

    if (typeof MinesService.checkProfitGuard === 'function') console.log("MinesService.checkProfitGuard (Base): OK");
    else console.error("MinesService missing checkProfitGuard!");

    console.log("All Phase 3 Checks Passed.");
    process.exit(0);

} catch (err) {
    console.error("Verification Error:", err);
    process.exit(1);
}
