/**
 * WALLET CHAIN INTEGRATION TEST
 * Enforcing:
 * 1. Games ONLY check/deduct 'wallet.game'
 * 2. Transfers: Income -> Main -> Game
 * 3. NO Income -> Game
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const InternalTransferService = require('../modules/wallet/InternalTransferService');
const BaseGameService = require('../services/BaseGameService');
const WalletService = require('../modules/wallet/WalletService');

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/man2man_test_chain';

async function runChainTest() {
    console.log("🔵 Starting Wallet Chain Verification...");
    const logs = [];

    try {
        await mongoose.connect(DB_URI);

        // CLEANUP
        await User.deleteMany({ username: 'chain_test_user' });

        // CREATE USER
        const user = await User.create({
            fullName: 'Chain Test', username: 'chain_test_user', phone: '01000000000', password: 'hash',
            country: 'BD',
            wallet: {
                main: 1000,
                game: 0,    // Quick Wallet
                income: 500
            }
        });
        console.log(`✅ User Created: ${user._id} | Main: 1000, Game: 0, Income: 500`);

        // ==========================================
        // TEST CASE 1: Bet with 0 Game Balance (Should Fail)
        // ==========================================
        console.log("\n🔸 Test Case 1: Bet with 0 Game Balance (Expect Failure)...");
        try {
            const game = new BaseGameService('chain_test');
            await game.handleBet(user._id, 100);
            logs.push({ test: 'Bet 0 Game Balance', status: 'FAILED', msg: 'Allowed bet with 0 game balance' });
        } catch (e) {
            if (e.message.includes('Insufficient Game Balance')) {
                logs.push({ test: 'Bet 0 Game Balance', status: 'PASSED', msg: e.message });
            } else {
                logs.push({ test: 'Bet 0 Game Balance', status: 'FAILED', msg: 'Wrong error: ' + e.message });
            }
        }

        // ==========================================
        // TEST CASE 2: Invalid Direct Transfer (Income -> Game)
        // ==========================================
        console.log("\n🔸 Test Case 2: Block Income -> Game Transfer...");
        try {
            // Attempt standard transfer (Assuming WalletService handles generic or we block in logic)
            // Note: InternalTransferService only handles checking Main/Game. 
            // WalletService.transferFunds is generic. We must verify if it allows checking source.
            await WalletService.transferFunds(user._id, 100, 'income', 'game', 'Illegal Transfer');
            logs.push({ test: 'Income -> Game Block', status: 'FAILED', msg: 'Transfer allowed unexpectedly' });
        } catch (e) {
            // We expect this to fail OR we need to implement the block if it passes currently.
            // If WalletService is generic, it might pass. We will see.
            logs.push({ test: 'Income -> Game Block', status: 'PASSED', msg: e.message }); // IF it fails.
        }

        // ==========================================
        // TEST CASE 3: Valid Chain (Main -> Game -> Bet)
        // ==========================================
        console.log("\n🔸 Test Case 3: Valid Chain (Main -> Game -> Bet)...");
        try {
            // A. Main -> Game
            const transfer = await InternalTransferService.transfer(user._id, 'main_to_game', 500);
            if (transfer.gameBalance !== 500) throw new Error("Transfer mismatch");

            // B. Content Check
            const u2 = await User.findById(user._id);
            if (u2.wallet.main !== 500 || u2.wallet.game !== 500) throw new Error("Wallet state mismatch after transfer");

            // C. Bet
            const game = new BaseGameService('chain_test');
            await game.handleBet(user._id, 100); // 500 - 100 = 400

            const u3 = await User.findById(user._id);
            if (u3.wallet.game !== 400) throw new Error("Bet deduction failed");

            logs.push({ test: 'Valid Chain Flow', status: 'PASSED', msg: 'All steps valid' });

        } catch (e) {
            logs.push({ test: 'Valid Chain Flow', status: 'FAILED', msg: e.message });
        }

    } catch (err) {
        console.error("FATAL:", err);
    } finally {
        console.log("\n====== INTERNAL TEST LOGS ======");
        logs.forEach(l => console.log(`TEST: ${l.test} | STATUS: ${l.status} | MSG: ${l.msg}`));
        await mongoose.disconnect();
        process.exit(0);
    }
}

runChainTest();
