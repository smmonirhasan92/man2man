// Simulation of Collective Prize Pool & Triple-Stream Logic
const ADMIN_PERCENT = 0.10;
const USER_INTEREST_PERCENT = 0.15;
const ACTIVE_POOL_PERCENT = 0.75;

const HARD_STOP_LIMIT = 500; // max payout size
let adminIncomeVault = 0;
let userInterestFund = 0;
let activePrizePool = 0;

// Simulate 10 users placing bets
const bets = [
    { user: 'User_1', amount: 5 },  // Bronze
    { user: 'User_2', amount: 10 }, // Silver
    { user: 'User_3', amount: 25 }, // Gold
    { user: 'User_4', amount: 5 },
    { user: 'User_5', amount: 10 },
    { user: 'User_6', amount: 25 },
    { user: 'User_7', amount: 5 },
    { user: 'User_8', amount: 10 },
    { user: 'User_9', amount: 5 },
    { user: 'User_10', amount: 25 },
];

console.log("=== Collective Prize Pool Simulation ===");
let totalCollected = 0;
bets.forEach(b => totalCollected += b.amount);

console.log(`\nTotal Bets Collected from 10 Users: ${totalCollected} NXS`);

const adminCut = totalCollected * ADMIN_PERCENT;
const interestCut = totalCollected * USER_INTEREST_PERCENT;
const poolCut = totalCollected * ACTIVE_POOL_PERCENT;

adminIncomeVault += adminCut;
userInterestFund += interestCut;
activePrizePool += poolCut;

console.log(`\n[Three-Way Distribution Applied]`);
console.log(`1. Admin Income Vault (10%): +${adminCut} NXS (Risk-Free Profit)`);
console.log(`2. User-Interest Fund (15%): +${interestCut} NXS (For future surprise jackpots)`);
console.log(`3. Active Prize Pool  (75%): +${poolCut} NXS (Used for payout of this round)`);

console.log(`\n=== Payout Simulation ===`);
// Distribute Active Prize Pool among the users based on RTP.
// We will assign a massive jackpot to User_3, medium to User_1, and small/losses to others
let remainingPool = activePrizePool;

const payouts = [];
bets.forEach((b, index) => {
    let win = 0;
    if (index === 2) {
        // Force a large payout, say 60 NXS
        win = 60;
    } else if (index === 0) {
        win = 10;
    } else if (index === 5) {
        // Try a MASSIVE payout to test User-Interest fund safety net
        win = 50; 
    } else {
        win = 0.0; // loss or small
    }
    
    // Safety Net: Can the Active Prize Pool cover it?
    if (win > remainingPool) {
        // Can User-Interest Fund cover it?
        const deficit = win - remainingPool;
        if (userInterestFund >= deficit) {
             console.log(`[BOOST] User-Interest Fund used to boost ${b.user}'s reward! Used: ${deficit} NXS`);
             userInterestFund -= deficit;
             remainingPool = 0;
        } else {
             win = remainingPool; // Downgrade to remaining pool
             remainingPool = 0;
        }
    } else {
        remainingPool -= win;
    }
    
    // Hard-Stop Expense Protection
    if (win > HARD_STOP_LIMIT) {
        console.log(`[HARD STOP] Blocked excessive win of ${win} NXS for ${b.user}`);
        remainingPool += (win - HARD_STOP_LIMIT);
        win = HARD_STOP_LIMIT;
    }

    payouts.push({ user: b.user, bet: b.amount, win: win });
});

console.table(payouts);

console.log(`\n=== Final State After 1 Round ===`);
console.log(`Admin Income Vault: ${adminIncomeVault} NXS`);
console.log(`User-Interest Fund: ${userInterestFund} NXS`);
console.log(`Remaining Active Pool: ${remainingPool} NXS (Rolls over to next batch)`);
console.log(`\nTotal Money Distributed to Users: ${payouts.reduce((sum, p) => sum + p.win, 0)} NXS`);
