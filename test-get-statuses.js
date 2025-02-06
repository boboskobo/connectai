import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = process.env.ROCK_API_KEY;
const ROCK_BASE_URL = process.env.ROCK_BASE_URL;

async function getConnectionStatuses() {
    try {
        // Get all connection statuses (DefinedType 4)
        const response = await axios.get(`${ROCK_BASE_URL}/DefinedValues?$filter=DefinedTypeId eq 4`, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Connection Statuses:');
        response.data.forEach(status => {
            console.log(`ID: ${status.Id}, Value: ${status.Value}`);
        });
        return response.data;
    } catch (error) {
        console.error('Failed to get statuses:', error.message);
        return null;
    }
}

console.log('Getting connection statuses...');
getConnectionStatuses(); 