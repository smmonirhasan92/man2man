const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (Login/Register)
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Mins
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

// Rate limiter for Task Claiming (Prevent Double Taps / Scripting)
exports.taskClaimLimiter = rateLimit({
    windowMs: 5 * 1000, // 5 Seconds
    max: 1, // 1 Request per 5 seconds
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please wait a moment before claiming another task.' }
});

// Rate limiter for Financial Transactions (Withdrawal / Deposit)
exports.walletLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Mins
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many financial requests, please try again later.' }
});
