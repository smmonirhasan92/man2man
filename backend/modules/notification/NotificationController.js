const Notification = require('./NotificationModel');

exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { limit = 20 } = req.query;

        // Fetch recent notifications
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(notifications);
    } catch (err) {
        console.error("Get Notifications Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.user.id;
        await Notification.updateMany({ userId, isRead: false }, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const NotificationService = require('./NotificationService');

exports.sendTestOTP = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const code = Math.floor(100000 + Math.random() * 900000);

        await NotificationService.send(
            userId,
            `Your Verification Code: ${code}. Do not share this with anyone.`,
            'warning'
        );

        res.json({ message: 'OTP Sent to Inbox', code });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.subscribePush = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const subscription = req.body;

        const User = require('../user/UserModel');

        // Atomically remove old subscription for this endpoint (if it exists)
        await User.updateOne(
            { _id: userId },
            { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
        );

        // Atomically push the new subscription
        await User.updateOne(
            { _id: userId },
            { $push: { pushSubscriptions: subscription } }
        );

        return res.status(201).json({ message: "Subscribed successfully." });
    } catch (err) {
        console.error("Push Subscription Error", err);
        res.status(500).json({ error: "Server error" });
    }
};
