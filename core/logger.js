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
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define transport arrays
const transports = [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
    }),
    // Write all logs with level 'info' and below to app.log
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/app.log'),
    }),
];

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            ),
        })
    );
}

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
});

// Export logging functions
export const logError = (error, context = '') => {
    const message = error instanceof Error ? error.stack : error.toString();
    logger.error(`[${context}] ${message}`);
};

export const logWarning = (message, context = '') => {
    logger.warn(`[${context}] ${message}`);
};

export const logInfo = (message, context = '') => {
    logger.info(`[${context}] ${message}`);
};

export const logDebug = (message, context = '') => {
    logger.debug(`[${context}] ${message}`);
};

export const logHttp = (message, context = '') => {
    logger.http(`[${context}] ${message}`);
};

export default logger; 