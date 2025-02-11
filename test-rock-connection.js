import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from './logger.js';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

// Make the API key and URL easier to read
const ROCK_API_KEY = process.env.ROCK_API_KEY;
const ROCK_BASE_URL = process.env.ROCK_BASE_URL;

// Simple test function
async function testConnection() {
    try {
        await logInfo('Testing Rock RMS connection...');
        const response = await axios.get(`${ROCK_BASE_URL}/People/1`, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        await logInfo('Connection successful!');
        await logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
        return true;
    } catch (error) {
        await logError(error, 'connection test');
        return false;
    }
}

// Run the test
console.log('Testing Rock RMS connection...');
testConnection(); 