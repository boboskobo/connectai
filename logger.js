import fs from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${context}: ${error.message}\n`;
    
    await fs.appendFile(`${__dirname}/error.log`, logEntry);
    console.error(logEntry);
}

export async function logInfo(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - INFO: ${message}\n`;
    
    await fs.appendFile(`${__dirname}/app.log`, logEntry);
    console.log(message);
} 