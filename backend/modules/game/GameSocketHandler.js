
module.exports = (io, socket) => {

    /**
     * Join a Game Room
     */
    const ALLOWED_GAMES = ['super-ace', 'lottery'];

    socket.on('join_room', (gameType) => {
        if (!ALLOWED_GAMES.includes(gameType)) {
            return;
        }

        if (!socket.rooms.has(gameType)) {
            socket.join(gameType);
            // console.log(`[SOCKET] Joined ${gameType}`);
        }

        socket.emit('game_state', { status: 'WAITING', message: 'Welcome to ' + gameType });
    });

    // Future: Super Ace Realtime Events (Big Win Broadcasts etc)
};
