import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = process.env.ROCK_API_KEY;
const ROCK_BASE_URL = process.env.ROCK_BASE_URL;

async function createConnectionStatus() {
    try {
        // Create new Connect App Contact status
        const newStatus = {
            DefinedTypeId: 4, // Connection Status type
            Value: 'Connect App Contact',
            Description: 'Contact created through Connect App integration',
            Order: 0,
            IsSystem: false,
            IsActive: true
        };

        const response = await axios.post(`${ROCK_BASE_URL}/DefinedValues`, newStatus, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        await logInfo('Status created successfully!');
        await logInfo(`New Status ID: ${response.data.Id}`);
        return response.data.Id;
    } catch (error) {
        await logError(error, 'createConnectionStatus');
        if (error.response) {
            await logError(error.response.data, 'Response:');
        }
        return null;
    }
}

async function cleanupAndCreateStatus() {
    try {
        await logInfo('Starting status cleanup and creation...');
        
        const response = await axios.get(`${ROCK_BASE_URL}/DefinedValues`, {
            params: {
                $filter: "DefinedTypeId eq 4 and Value eq 'Connect App Contact'"
            },
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.length > 0) {
            const keepId = response.data[0].Id;
            await logInfo(`Found existing status, keeping ID: ${keepId}`);

            for (let i = 1; i < response.data.length; i++) {
                await axios.delete(`${ROCK_BASE_URL}/DefinedValues/${response.data[i].Id}`, {
                    headers: {
                        'Authorization-Token': ROCK_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                await logInfo(`Deleted duplicate status ID: ${response.data[i].Id}`);
            }

            return keepId;
        }

        await logInfo('No existing status found, creating new one...');
        return await createConnectionStatus();
    } catch (error) {
        await logError(error, 'cleanupAndCreateStatus');
        return null;
    }
}

await logInfo('Starting status management...');
await cleanupAndCreateStatus(); 