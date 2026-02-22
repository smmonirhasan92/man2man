const User = require('../modules/user/UserModel');

module.exports = async (req, res, next) => {
    // Ensure user is authenticated first (use after authMiddleware)
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const userId = req.user?.user?.id || req.user?._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found in DB.' });
        }

        const allowedRoles = ['admin', 'super_admin', 'employee_admin'];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Attach fresh user role to req for downstream usage
        if (req.user.user) req.user.user.role = user.role;
        else req.user.role = user.role;

        next();
    } catch (err) {
        console.error("Admin Middleware Error:", err);
        return res.status(500).json({ message: 'Server verification error' });
    }
};
