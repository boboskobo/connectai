import { logError } from './logger.js';

const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'GHL_APP_CLIENT_ID',
    'GHL_APP_CLIENT_SECRET',
    'GHL_WEBHOOK_SECRET',
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS'
];

export function validateEnv() {
    const missing = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        const error = `Missing required environment variables: ${missing.join(', ')}`;
        logError('Environment validation failed', { missing });
        throw new Error(error);
    }

    // Validate numeric values
    const numericVars = {
        PORT: process.env.PORT,
        RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
    };

    for (const [key, value] of Object.entries(numericVars)) {
        if (isNaN(parseInt(value))) {
            const error = `Environment variable ${key} must be a number`;
            logError('Environment validation failed', { key, value });
            throw new Error(error);
        }
    }

    return true;
} 