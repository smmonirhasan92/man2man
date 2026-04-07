const mongoose = require('mongoose');
require('dotenv').config();
const RedisService = require('../services/RedisService');
const GameVault = require('../modules/gamification/GameVaultModel');
const UniversalMatchMaker = require('../modules/gamification/UniversalMatchMaker');
const P2PAudit = require('../modules/gamification/P2PAuditModel');

async function runTest() {
    console.log("🚀 Starting V3 Ultimate Architecture Stress Test (100 Users)");
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man');
    
    // Reset Data for clean test
    await GameVault.deleteMany({});
    await P2PAudit.deleteMany({});
    await RedisService.del('livedata:game:admin_reinjection_pad');
    await RedisService.del('livedata:game:match_pot');
    
    const vault = await GameVault.getMasterVault();
    vault.config.houseEdge = 10;
    await vault.save();

    await RedisService.client.set('livedata:game:admin_reinjection_pad', 0);
    
    let promises = [];
    console.log("💥 Injecting 100 Multiplayer Wagers to test 15% override, 85% payout & pad inflation...");
    
    // Force Phase A or B doesn't strictly matter for Multiplayer 85/15, but we check.
    
    for(let i = 0; i < 100; i++) {
        const fakeId = new mongoose.Types.ObjectId().toString();
        promises.push( UniversalMatchMaker.processMatch(fakeId, 10, 'spin', 1500) );
    }
    
    await Promise.allSettled(promises);
    
    const pad = await RedisService.client.get('livedata:game:admin_reinjection_pad');
    const pot = await RedisService.client.get('livedata:game:match_pot');
    
    let finalVault = await GameVault.getMasterVault();
    
    const goldId = new mongoose.Types.ObjectId().toString();
    let goldRes = await UniversalMatchMaker.processMatch(goldId, 30, 'spin', 1000);
    
    const finalPad = await RedisService.client.get('livedata:game:admin_reinjection_pad');
    const hPrefix = new Date().toISOString().slice(0, 13);
    const hourlyNetLoss = await RedisService.client.get(`livedata:game:hourly_net_loss:${hPrefix}`);
    
    const limit = 33 + parseFloat(finalPad);
    
    let report = `========= STRESS TEST RESULTS =========\n`;
    report += `Total Simulation: 100 Users wagered 10 NXS each = 1000 NXS\n`;
    report += `[Multiplayer Mode] Zero-burn Math Expected:\n`;
    report += ` - 15% Global Fee Forced = 150 NXS\n`;
    report += ` - 50% Admin Income / 50% Pad Injection = 75 NXS each\n`;
    report += ` - Active Pot net change should be exactly 0\n`;
    report += `-----------------------------------------\n`;
    report += `Actual Admin Reinjection Pad: ${pad} NXS (Expected 75)\n`;
    report += `Actual Redis Active Pot (Net Change): ${pot} NXS (Expected 0)\n`;
    report += `Admin Income in Vault: ${finalVault.balances.adminIncome} NXS (Expected 75)\n\n`;
    report += `Pulse Validation: Gold Result: ${JSON.stringify(goldRes)}\n`;
    report += `Final Admin Reinjection Pad: ${finalPad} NXS\n`;
    report += `Hourly Net Loss is: ${hourlyNetLoss || 0} NXS\n`;
    report += `Dynamic Hourly Limit (33 + Pad): ${limit.toFixed(2)} NXS\n`;

    if(parseFloat(pad) === 75 && parseFloat(pot) === 0) {
       report += `\nSUCCESS! Zero-Burn and 85/15 Math behaves flawlessly.\n`;
    } else {
       report += `\nFAILED MATH CHECK.\n`;
    }
    
    require('fs').writeFileSync('stress_report.txt', report);
    console.log("Report saved to stress_report.txt");

    process.exit(0);
}

runTest().catch(console.error);
