const User = require('../modules/user/UserModel');

module.exports = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            // Support both req.user.user.id (Legacy) and req.user.id
            const userId = req.user?.user?.id || req.user?.id;

            if (!req.user || !userId) {
                return res.status(401).json({ message: 'Unauthorized: No user session found' });
            }

            const user = await User.findById(userId);

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Check if user role is in allowedRoles
            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }

            // Sync user role in request object for downstream controllers
            if (req.user.user) {
                req.user.user.role = user.role;
            } else {
                req.user.role = user.role;
            }

            next();
        } catch (err) {
            console.error('Role Middleware Error:', err);
            res.status(500).json({ message: 'Server Error during role verification' });
        }
    };
};
