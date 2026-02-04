const { User } = require('../models');

module.exports = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.user.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const user = await User.findByPk(req.user.user.id);

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Check if user role is in allowedRoles
            if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }

            // Update user role in request (in case it changed)
            req.user.user.role = user.role;
            next();
        } catch (err) {
            console.error('Role Middleware Error:', err);
            res.status(500).json({ message: 'Server Error role checking' });
        }
    };
};
