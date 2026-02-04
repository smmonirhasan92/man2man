const GameService = require('./GameService');
const AviatorService = require('./AviatorService'); // [NEW] Link to Service
const ProvablyFairService = require('./ProvablyFairService');

module.exports = (io, socket) => {

    /**
     * Join a Game Room
     */
    const ALLOWED_GAMES = ['aviator', 'super-ace', 'lottery'];

    /**
     * Join a Game Room
     */
    socket.on('join_room', (gameType) => {
        if (!ALLOWED_GAMES.includes(gameType)) {
            // console.warn(`[SOCKET] Blocked join for invalid game: ${gameType}`);
            return;
        }

        // Leave other game rooms if needed (optional, but good for cleanup)
        // socket.rooms.forEach(room => { if (ALLOWED_GAMES.includes(room) && room !== gameType) socket.leave(room); });

        // Join
        if (!socket.rooms.has(gameType)) {
            socket.join(gameType);
            // console.log(`[SOCKET] Joined ${gameType}`);
        }

        // Send current game state if Active
        if (gameType === 'aviator') {
            socket.emit('aviator_state', AviatorService.getState());
        } else {
            socket.emit('game_state', { status: 'WAITING', message: 'Welcome to ' + gameType });
        }
    });

    /**
     * Place a Real-Time Bet
     */
    socket.on('place_bet', async (data) => {
        try {
            const userId = socket.request.user ? socket.request.user.id : data.userId;
            const { amount, choice } = data;
            const parsedAmount = parseFloat(amount);

            if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Invalid Bet Amount');

            // 1. DELEGATE TO AVIATOR SERVICE (Server Logic)
            await AviatorService.placeBet(userId, parsedAmount);

            // Acknowledge Bet
            socket.emit('bet_accepted', { amount: parsedAmount, choice, txId: 'TX-' + Date.now() });

            // Broadcast to room (Optional, maybe Service handles this via state updates?)
            // Service handles generic state, but maybe we want "Player X bet Y" toast.
            socket.to('aviator').emit('public_bet', { user: 'Player', amount: parsedAmount });

        } catch (err) {
            console.error(`[AVIATOR] Bet Failed: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    /**
     * CASH OUT
     */
    socket.on('cash_out', async (data) => {
        try {
            const userId = socket.request.user ? socket.request.user.id : data.userId;

            // 1. DELEGATE TO AVIATOR SERVICE
            // [FIX] Pass betId and multiplier from client (Service validates them)
            const { betId, multiplier } = data;

            if (!multiplier || isNaN(multiplier)) {
                throw new Error("Invalid Cashout Multiplier");
            }

            const result = await AviatorService.cashOut(userId, betId, parseFloat(multiplier));

            const { winAmount, cashedOutAt } = result;

            socket.emit('cash_out_success', { winAmount, multiplier: cashedOutAt });
            socket.to('aviator').emit('public_win', { user: 'Player', amount: winAmount, multiplier: cashedOutAt });

        } catch (err) {
            console.error(`[AVIATOR] Cashout Failed: ${err.message}`);
            socket.emit('error', { message: err.message });
        }
    });

    /**
     * Request Fair Verification
     */
    socket.on('verify_fairness', (data) => {
        try {
            const { serverSeed, clientSeed, nonce } = data;
            const result = ProvablyFairService.generateResult(serverSeed, clientSeed, nonce);
            socket.emit('verification_result', { result, isValid: true });
        } catch (err) {
            console.error(`[ERROR_TRACKER] Verification Failed: ${err.message}`);
        }
    });
};
