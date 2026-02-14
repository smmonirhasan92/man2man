const fs = require('fs');
const path = require('path');
// [NEW] MongoDB Log Model
let SystemLog;
try {
    SystemLog = require('./SystemLogModel');
} catch (e) {
    console.warn("SystemLogModel not found or DB not ready.");
}

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {

    static async logToDB(level, message, context = 'System', metadata = null) {
        if (!SystemLog) return;
        try {
            // Fire and forget (don't await to avoid blocking main thread)
            SystemLog.create({ level, message, context, metadata }).catch(err => {
                console.error("Values to write to DB Log:", err.message);
            });
        } catch (e) {
            console.error("DB Log Error", e);
        }
    }

    static error(message, stack = '', context = 'System') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [ERROR] ${message}\n${stack}\n----------------\n`;

        console.error(message);

        fs.appendFile(path.join(LOG_DIR, 'error.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });

        this.logToDB('error', message, context, { stack });
    }

    static info(message, context = 'System') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [INFO] ${message}\n`;

        console.log(message);

        fs.appendFile(path.join(LOG_DIR, 'system.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });

        // Optional: Don't flood DB with info, or use sampling
        // this.logToDB('info', message, context);
    }

    static warn(message, context = 'System') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [WARN] ${message}\n`;

        console.warn(message);

        fs.appendFile(path.join(LOG_DIR, 'system.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });

        this.logToDB('warn', message, context);
    }

    static game(game, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${game.toUpperCase()}] ${message}\n`;

        fs.appendFile(path.join(LOG_DIR, 'games.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to game log:", err);
        });

        // Log critical game events
        if (metadata.critical) {
            this.logToDB('info', `[${game}] ${message}`, 'GameEngine', metadata);
        }
    }

    static task(message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [TASK] ${message}\n`;

        fs.appendFile(path.join(LOG_DIR, 'task_engine_audit.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to task engine audit log:", err);
        });

        if (metadata.userId) {
            this.logToDB('info', message, 'TaskEngine', metadata);
        }
    }
}

module.exports = Logger;
