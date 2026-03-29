const Notification = require('./NotificationModel');
const webpush = require('web-push');

// Configure Web Push with VAPID keys if present
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log('✅ NotificationService: Web Push (VAPID) Initialized');
} else {
    console.warn('⚠️ NotificationService: Web Push VAPID keys missing from .env');
}

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
                const dynamicTitle = metadata.title || (message.includes('!') ? message.split('!')[0] : 'Update');
                
                io.to(`user_${userId}`).emit('notification', {
                    _id: notif._id,
                    title: dynamicTitle,
                    message: notif.message,
                    type: notif.type,
                    url: notif.metadata?.url || null,
                    createdAt: notif.createdAt
                });
                console.log(`[Notification] Sent to user_${userId}: ${message}`);
            }

            // 3. Send Web Push Notification to OS Layer (Suppress if skipPush is true)
            const skipPush = metadata.skipPush || false;

            if (!skipPush) {
                const User = require('../user/UserModel');
                const user = await User.findById(userId);

                if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                    const dynamicTitle = metadata.title || (message.includes('!') ? message.split('!')[0] : 'Update');
                    const payload = JSON.stringify({
                        title: dynamicTitle,
                        body: message,
                        type: type,
                        url: metadata.url || '/'
                    });

                    let subscriptionNeedsSave = false;
                    for (const sub of user.pushSubscriptions) {
                        try {
                            await webpush.sendNotification(sub, payload);
                        } catch (e) {
                            if (e.statusCode === 410 || e.statusCode === 404) {
                                user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                                subscriptionNeedsSave = true;
                            }
                        }
                    }

                    if (subscriptionNeedsSave) {
                        await user.save();
                    }
                }
            }

            return notif;
        } catch (err) {
            console.error('[Notification] Error:', err);
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
