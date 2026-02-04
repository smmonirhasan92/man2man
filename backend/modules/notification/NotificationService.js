const Notification = require('./NotificationModel');
let io = null;

class NotificationService {

    // Initialize IO instance (Called from server.js)
    static init(ioInstance) {
        // If namespaces are used, ioInstance can be the specific namespace object
        io = ioInstance;
        console.log('✅ NotificationService: Socket.io Initialized');
    }

    /**
     * Send Notification (DB + Real-time)
     * @param {string} userId - Recipient ID
     * @param {string} message - Notification Text
     * @param {string} type - 'info' | 'success' | 'warning' | 'error'
     * @param {Object} metadata - Optional data
     */
    static async send(userId, message, type = 'info', metadata = {}) {
        try {
            // 1. Save to DB (Persistence)
            const notif = await Notification.create({
                userId,
                message,
                type,
                metadata
            });

            // 2. Emit Real-time via Socket.io
            if (io) {
                // To support both general IO and Namespace, check method availability
                // Namespaces also use .to()

                // Room name convention: "user_<userId>"
                io.to(`user_${userId}`).emit('notification', {
                    _id: notif._id,
                    message: notif.message,
                    type: notif.type,
                    createdAt: notif.createdAt
                });
                console.log(`[Notification] Sent to user_${userId}: ${message}`);
            } else {
                console.warn('[Notification] Socket.io not initialized, skipping real-time emit.');
            }

            return notif;
        } catch (err) {
            console.error('[Notification] Error:', err);
            // Don't crash the main process if notification fails
        }
    }

    static async getUnread(userId) {
        return await Notification.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(50);
    }

    static async markAsRead(notificationId) {
        return await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    }

    static async markAllAsRead(userId) {
        return await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }
}

module.exports = NotificationService;
