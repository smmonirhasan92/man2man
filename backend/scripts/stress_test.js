const mongoose = require('mongoose');
const GameVault = require('../modules/gamification/GameVaultModel');
const UniversalMatchMaker = require('../modules/gamification/UniversalMatchMaker');

mongoose.connect('mongodb://127.0.0.1:27017/universal_game_core_v1').then(async () => {
    try {
        console.log("=== Staring MongoDB Gamification Engine Stress Test ===");
        // Ensure Vault is clean 
        await GameVault.deleteMany({});
        const vault = await GameVault.getMasterVault();
        
        // Admin forcefully seeds the vault to survive early jackpots
        vault.balances.activePool = 5000;
        vault.balances.adminIncome = 0;
        vault.balances.userInterest = 500;
        await vault.save();

        console.log(`[INIT] Initial Vault State: Active: ${vault.balances.activePool}, Interest: ${vault.balances.userInterest}`);

        const promises = [];
        const NUM_USERS = 50;

        console.log(`[TEST] Emulating ${NUM_USERS} concurrent Spin actions...`);

        // Spawn 50 users clicking "Spin" at the exact same millisecond
        for (let i = 0; i < NUM_USERS; i++) {
            // Random bet: Bronze(5), Silver(10), Gold(25)
            const bets = [5, 10, 25];
            const betAmount = bets[Math.floor(Math.random() * bets.length)];
            
            // Push to UniversalMatchMaker
            promises.push(
                UniversalMatchMaker.processMatch(`user_id_${i}`, betAmount, 'spin', 50)
            );
        }

        // Wait for all matches to process
        const results = await Promise.all(promises);

        // Analysis
        const totalWinnings = results.reduce((sum, r) => sum + r.winAmount, 0);
        const winCount = results.filter(r => r.isWin).length;
        console.log(`\n[RESULT] 50 Matches processed successfully!`);
        console.log(`[RESULT] Users won ${winCount} out of 50 spins.`);
        console.log(`[RESULT] Total Winnings Given to Users: ${totalWinnings.toFixed(2)} NXS`);

        // Check final DB state
        const finalVault = await GameVault.getMasterVault();
        console.log(`\n[FINAL VAULT] Admin Income: ${finalVault.balances.adminIncome.toFixed(2)} NXS`);
        console.log(`[FINAL VAULT] User Interest Fund: ${finalVault.balances.userInterest.toFixed(2)} NXS`);
        console.log(`[FINAL VAULT] Active Pool: ${finalVault.balances.activePool.toFixed(2)} NXS`);
        console.log(`[FINAL VAULT] Total Bets Tracked: ${finalVault.stats.totalBetsIn.toFixed(2)} NXS`);
        console.log(`[FINAL VAULT] Total Payouts Tracked: ${finalVault.stats.totalPayoutsOut.toFixed(2)} NXS`);
        console.log(`[FINAL VAULT] Total Games Played: ${finalVault.stats.totalGamesPlayed}`);
        
    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        mongoose.disconnect();
    }
});
