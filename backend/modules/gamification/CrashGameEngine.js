/**
 * Universal Multiplier API - Crash Mathematics Engine
 */

/**
 * Calculates the exact crash multiplier based on real-time pool liquidity.
 * Guarantees that the theoretical max payload NEVER exceeds available funds.
 * 
 * @param {Number} poolLiquidity - Current NXS inside the game pool AFTER collecting this round's bets.
 * @param {Number} totalBets - The gross total NXS wagered by all players this round.
 * @returns {Number} multiplier (e.g. 1.25)
 */
function generateSecureCrashPoint(poolLiquidity, totalBets) {
    // If no bets, provide a standard random flight for visual effect
    if (totalBets === 0) {
        let rand = Math.random();
        let flight = 0.95 / rand;
        return Math.max(1.00, Math.floor(flight * 100) / 100);
    }

    // 1. Calculate Absolute Maximum affordable multiplier
    // M_max is the absolute peak where, if all players cash out, the pool hits 0.
    const M_max = poolLiquidity / totalBets;

    // 2. Generate a Theoretical Natural Crash (Standard 95% RTP curve)
    const naturalRandom = Math.random();
    const theoreticalCrash = 0.95 / Math.random(); // Gives a long tail power distribution

    let finalCrash = 1.00;

    // 3. The Iron Gate - Protect the Liquidity Pool
    if (theoreticalCrash > M_max || M_max < 1.05) {
        // Danger Zone: The pool cannot afford the natural spread.
        if (M_max < 1.00) {
            // Absolute zero liquidity - Force instant crash.
            finalCrash = 1.00; 
        } else {
            // We force a localized crash safely beneath the absolute maximum limit.
            // It crashes between 70% to 95% of the absolute M_max to ensure profit.
            const safetyFactor = 0.70 + (Math.random() * 0.25); 
            finalCrash = M_max * safetyFactor;
        }
    } else {
        // Safe Zone: The pool is loaded, let the natural algorithm play out!
        finalCrash = theoreticalCrash;
    }

    return Math.max(1.00, Math.floor(finalCrash * 100) / 100);
}

module.exports = {
    generateSecureCrashPoint
};
