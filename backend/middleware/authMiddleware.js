const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Check for token in x-auth-token or Authorization header
    let token = req.header('x-auth-token') || req.header('Authorization');

    if (!token) {
        console.log(`[AUTH FAIL] No Token for: ${req.method} ${req.originalUrl}`);
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    if (!process.env.JWT_SECRET) {
        // Critical: Do not run without a secret
        console.error('FATAL: JWT_SECRET is not defined in .env');
        return res.status(500).json({ message: 'Server Configuration Error' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('DEBUG MIDDLEWARE DECODED:', JSON.stringify(decoded));
        req.user = decoded; // Reverted to legacy structure
        console.log('DEBUG MIDDLEWARE REQ.USER:', JSON.stringify(req.user));

        // Note: This is a stateless JWT implementation. 
        // Multiple logins are allowed by default as we don't track token versions in DB.
        // Super Admin device limit bypass is handled in authController.

        next();
    } catch (err) {
        console.error(`[AUTH ERROR] Token Verification Failed: ${err.message}`);
        res.status(401).json({ message: 'Invalid token.', error: err.message });
    }
};
