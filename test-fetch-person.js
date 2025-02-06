import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = process.env.ROCK_API_KEY;
const ROCK_BASE_URL = process.env.ROCK_BASE_URL;

async function fetchPerson(personId = 1) {
    try {
        const response = await axios.get(`${ROCK_BASE_URL}/People/${personId}`, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        console.log('Person found:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch person:', error.message);
        return null;
    }
}

// Fetch the person we created earlier
console.log('Fetching person...');
fetchPerson(); 