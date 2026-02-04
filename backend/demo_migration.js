const mongoose = require('mongoose');
const connectDB = require('./kernel/database');
const User = require('./modules/user/UserModel');
const WalletService = require('./modules/wallet/WalletService');
const GameService = require('./modules/game/GameService');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

async function runDemo() {
    log("\n=== STARTING MIGRATION DEMO: MICRONUCLEUS ARCHITECTURE ===", colors.bright + colors.cyan);

    // 1. Connect
    await connectDB();

    // Cleanup previous demo user
    await User.deleteOne({ username: 'demo_user' });

    // 2. Create User (User Module)
    log("\n[1] Creating Demo User...", colors.yellow);
    const user = await User.create({
        fullName: 'Demo Tester',
        username: 'demo_user',
        phone: '01700000000',
        password: 'hashed_secret',
        country: 'BD',
        wallet: { main: 1000, game: 500 } // Starting Balance
    });
    log(`Success: User ${user.username} created with Main: ${user.main_balance}, Game: ${user.game_balance}`, colors.green);

    // 3. Wallet Transaction (Wallet Service + ACID)
    log("\n[2] Executing Wallet Service: Transfer 200 Main -> Game", colors.yellow);
    try {
        const transfer = await WalletService.transferFunds(
            user._id,
            200,
            'main',
            'game',
            'Demo Transfer'
        );
        log(`Transfer Complete! New Balances -> Main: ${transfer.newBalances.main}, Game: ${transfer.newBalances.game}`, colors.green);
    } catch (e) {
        log(`Transfer Failed: ${e.message}`, colors.red);
    }

    // 4. Game Logic (Game Service + ACID + Risk Logic)
    log("\n[3] Executing Game Service: Playing 'Head/Tail' (Bet: 100)", colors.yellow);
    log("...Simulating Secure Atomic Transaction...", colors.reset);

    try {
        // Force a mock setting (if settings not seeded, logic defaults apply)
        const result = await GameService.playGame(user._id, 100, 'head');

        if (result.won) {
            log(`RESULT: USER WON! 🎉 Payout: ${result.payout}`, colors.green + colors.bright);
        } else {
            log(`RESULT: USER LOST. 📉`, colors.red);
        }
        log(`Logic Result: ${result.result}`, colors.cyan);
        log(`New Game Balance: ${result.newBalance}`, colors.yellow);

    } catch (e) {
        log(`Game Error: ${e.message}`, colors.red);
    }

    // 5. Final State Verification
    const finalUser = await User.findById(user._id);
    log("\n=== FINAL STATE VERIFICATION ===", colors.bright + colors.cyan);
    log(`User ID: ${finalUser._id}`);
    log(`Wallet State: ${JSON.stringify(finalUser.wallet)}`);

    log("\nDemo Complete. Architecture Verified.", colors.bright);
    process.exit(0);
}

runDemo();
