const winston = require('winston');
require('winston-mongodb');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        // File Log (Local Backup)
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// Add Console Log for Dev
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

// Add MongoDB Transport (The "Perfect History" Storage)
if (process.env.MONGODB_URI) {
    logger.add(new winston.transports.MongoDB({
        db: process.env.MONGODB_URI,
        options: { useUnifiedTopology: true },
        collection: 'system_logs',
        level: 'info',
        storeHost: true,
        tryReconnect: true,
        metaKey: 'meta' // Ensure metadata is stored in 'meta' field
    }));
}

module.exports = logger;
