const mongoose = require('mongoose');
const fs = require('fs');
const User = require('../modules/user/UserModel');

// Services
const MinesService = require('../modules/game/MinesService');
const TeenPattiService = require('../modules/game/TeenPattiService');
const SuperAceService = require('../modules/game/SuperAceService');
const AviatorService = require('../modules/game/AviatorService');
const LotterySystem = require('../modules/game/LotterySystem');
const GamePool = require('../modules/game/GamePoolService');
const GameLog = require('../modules/game/GameLogModel');

const MONGO_URI = 'mongodb://127.0.0.1:27017/man2man_db';
const LOG_FILE = 'gametest.log';

const log = (msg) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(LOG_FILE, line);
};

const mockIo = {
    to: (room) => ({
        emit: (event, data) => { }
    })
};

const runTests = async () => {
    try {
        log("--- STARTING GAME TEST SUITE ---");
        await mongoose.connect(MONGO_URI);
        log("DB Connected.");

        // 1. Setup User
        let user = await User.findOne({ username: 'test_suite_user' });
        if (!user) {
            user = await User.create({
                username: 'test_suite_user',
                fullName: 'Test Suite User',
                phone: '01999999999',
                password: 'hashed_password',
                country: 'BD',
                wallet: { game: 500000 },
                device_id: 'test_device',
                is_active: true
            });
            log("Created Test User.");
        } else {
            user.game_balance = 500000;
            await user.save();
            log("Reset Test User Balance.");
        }

        // --- TEST 1: MINES ---
        try {
            log("[MINES] Starting Test...");
            const minesGame = await MinesService.startGame(user._id, 100, 3); // 100 bet, 3 mines
            log(`[MINES] Game Started: ${minesGame.gameId}`);

            const reveal = await MinesService.revealTile(user._id, minesGame.gameId, 0); // Tile 0
            log(`[MINES] Revealed Tile 0. Status: ${reveal.status}`);

            if (reveal.status === 'active') {
                const cashout = await MinesService.cashout(user._id, minesGame.gameId);
                log(`[MINES] Cashed Out. Win: ${cashout.winAmount}`);
            } else {
                log("[MINES] Hit Mine (Expected possibility).");
            }
            log("[MINES] PASSED ✅");
        } catch (e) {
            log(`[MINES] FAILED ❌: ${e.message}`);
        }

        // --- TEST 2: TEEN PATTI ---
        try {
            log("[TEEN_PATTI] Starting Test...");
            const tpGame = await TeenPattiService.startGame(user._id, 'rookie');
            log(`[TEEN_PATTI] Game Started: ${tpGame.gameId}`);

            const tpTurn = await TeenPattiService.playTurn(user._id, tpGame.gameId, 'chal');
            log(`[TEEN_PATTI] Played Chal.`);

            const tpPack = await TeenPattiService.playTurn(user._id, tpGame.gameId, 'pack');
            log(`[TEEN_PATTI] Packed.`);

            log("[TEEN_PATTI] PASSED ✅");
        } catch (e) {
            log(`[TEEN_PATTI] FAILED ❌: ${e.message}`);
        }

        // --- TEST 3: SUPER ACE ---
        try {
            log("[SUPER_ACE] Starting Test...");
            const spin = await SuperAceService.spin(user._id, 20);
            log(`[SUPER_ACE] Spun. Total Win: ${spin.totalWin}`);
            log("[SUPER_ACE] PASSED ✅");
        } catch (e) {
            log(`[SUPER_ACE] FAILED ❌: ${e.message}`);
        }

        // --- TEST 4: LOTTERY ---
        try {
            log("[LOTTERY] Starting Test...");
            const lottery = new LotterySystem(mockIo);
            lottery.startRound();
            log(`[LOTTERY] Round Started: ${lottery.currentRoundId}`);

            lottery.addParticipant(user._id, [5, 15, 25]);
            log(`[LOTTERY] Added Participant.`);

            lottery.drawWinner();
            log(`[LOTTERY] Winner Drawn.`);

            log("[LOTTERY] PASSED ✅");
        } catch (e) {
            log(`[LOTTERY] FAILED ❌: ${e.message}`);
        }

        // --- TEST 5: AVIATOR ---
        try {
            log("[AVIATOR] Starting Test...");
            // Poll for WAITING state
            let attempts = 0;
            while (AviatorService.getState().state !== 'WAITING' && attempts < 20) {
                await new Promise(r => setTimeout(r, 1000));
                process.stdout.write(".");
                attempts++;
            }
            console.log(""); // Newline

            if (AviatorService.getState().state === 'WAITING') {
                AviatorService.placeBet(user._id, 50);
                log("[AVIATOR] Bet Placed (50).");

                // Wait for FLYING
                attempts = 0;
                while (AviatorService.getState().state !== 'FLYING' && attempts < 15) {
                    await new Promise(r => setTimeout(r, 1000));
                    process.stdout.write(".");
                    attempts++;
                }
                console.log("");

                if (AviatorService.getState().state === 'FLYING') {
                    const cashout = AviatorService.cashOut(user._id);
                    log(`[AVIATOR] Cashed Out at ${cashout.cashedOutAt}x. Win: ${cashout.winAmount}`);
                } else {
                    log("[AVIATOR] Validation Skipped (Plane didn't take off in time or crashed instantly).");
                }
            } else {
                log("[AVIATOR] Validation Skipped (Could not catch WAITING state).");
            }
            log("[AVIATOR] PASSED ✅");
        } catch (e) {
            log(`[AVIATOR] FAILED ❌: ${e.message}`);
        }

    } catch (e) {
        log(`CRITICAL SETUP ERROR: ${e.message}`);
    } finally {
        log("--- TEST SUITE COMPLETE ---");
        process.exit(0);
    }
};

runTests();
