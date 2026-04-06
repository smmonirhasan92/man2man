try {
    require('mongoose');
    console.log("✅ mongoose loaded");
    require('./modules/gamification/UniversalMatchMaker');
    console.log("✅ UniversalMatchMaker loaded");
    require('./services/RedisService');
    console.log("✅ RedisService loaded");
    require('./modules/gamification/GameVaultModel');
    console.log("✅ GameVaultModel loaded");
    require('./modules/gamification/P2PAuditModel');
    console.log("✅ P2PAuditModel loaded");
} catch (e) {
    console.error("❌ LOAD FAILED:", e.message);
}
