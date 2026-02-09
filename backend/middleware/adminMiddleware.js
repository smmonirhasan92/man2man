module.exports = (req, res, next) => {
    // Ensure user is authenticated first (use after authMiddleware)
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Role check logic based on jwt payload structure
    const userRole = req.user.user ? req.user.user.role : req.user.role;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
};
