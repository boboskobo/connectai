import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = process.env.ROCK_API_KEY;
const ROCK_BASE_URL = process.env.ROCK_BASE_URL;

async function updatePersonStatus(personId = 1, statusId = 1949) {
    try {
        const response = await axios.patch(`${ROCK_BASE_URL}/People/${personId}`, {
            ConnectionStatusValueId: statusId
        }, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log('Status updated successfully!');
        console.log('Updated Person:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to update status:', error.message);
        return null;
    }
}

console.log('Updating person status...');
updatePersonStatus(); 