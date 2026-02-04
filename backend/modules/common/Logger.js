const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {

    static error(message, stack = '') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [ERROR] ${message}\n${stack}\n----------------\n`;

        console.error(message); // Still show in terminal

        fs.appendFile(path.join(LOG_DIR, 'error.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });
    }

    static info(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [INFO] ${message}\n`;

        console.log(message);

        fs.appendFile(path.join(LOG_DIR, 'system.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });
    }

    static warn(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [WARN] ${message}\n`;

        console.warn(message);

        fs.appendFile(path.join(LOG_DIR, 'system.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to log file:", err);
        });
    }

    static game(game, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${game.toUpperCase()}] ${message}\n`;

        fs.appendFile(path.join(LOG_DIR, 'games.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to game log:", err);
        });
    }

    static task(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [TASK] ${message}\n`;

        fs.appendFile(path.join(LOG_DIR, 'task_engine_audit.log'), logEntry, (err) => {
            if (err) console.error("Failed to write to task engine audit log:", err);
        });
    }
}

module.exports = Logger;
