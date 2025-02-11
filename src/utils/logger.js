import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
    levels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.simple()
            )
        }),
        // Write all logs to app.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/app.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        // Write error logs to error.log
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error'
        })
    ]
});

// Helper functions for consistent logging
export async function logError(message, error) {
    const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        ...error
    } : error;

    logger.error({
        message,
        error: errorDetails,
        timestamp: new Date().toISOString()
    });
}

export async function logInfo(message, data = {}) {
    logger.info({
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

export async function logDebug(message, data = {}) {
    logger.debug({
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

export default logger; 