// Socket Service Singleton
let ioInstance = null;

module.exports = {
    init: (io) => {
        ioInstance = io;
    },
    getIO: () => {
        if (!ioInstance) return null;
        return ioInstance;
    },
    broadcast: (room, event, data) => {
        if (ioInstance) {
            ioInstance.to(room).emit(event, data);
        }
    }
};
