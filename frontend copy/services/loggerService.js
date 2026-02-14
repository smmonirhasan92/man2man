/**
 * Frontend Logger Service
 * Standardizes error reporting and console logging.
 */

const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG',
};

class LoggerService {
    constructor() {
        this.isDev = process.env.NODE_ENV === 'development';
    }

    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    info(message, data = null) {
        if (this.isDev) {
            console.log(this.formatMessage(LOG_LEVELS.INFO, message), data || '');
        }
    }

    warn(message, data = null) {
        console.warn(this.formatMessage(LOG_LEVELS.WARN, message), data || '');
    }

    error(message, error = null) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message), error || '');
        // In a real app, you would send this to Sentry or a backend log endpoint here
    }

    debug(message, data = null) {
        if (this.isDev) {
            console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message), data || '');
        }
    }
}

export const logger = new LoggerService();
