import axios from 'axios';
import dotenv from 'dotenv';

const ROCK_API_KEY = 'orGdK9QLAQBhFVg0581VuLB3';
const ROCK_BASE_URL = 'https://devrock.flatironschurch.com/api';

async function getDefinedTypes() {
    try {
        // Get all defined types first
        const response = await axios.get(`${ROCK_BASE_URL}/DefinedTypes`, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('\nAvailable Defined Types:');
        response.data.forEach(type => {
            console.log(`ID: ${type.Id}, Name: ${type.Name}, Description: ${type.Description}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

// Just get campuses separately since we know that endpoint works
async function getCampuses() {
    try {
        const response = await axios.get(`${ROCK_BASE_URL}/Campuses`, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('\nCampuses:');
        response.data.forEach(campus => {
            console.log(`ID: ${campus.Id}, Name: ${campus.Name}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

console.log('Getting Rock RMS defined types...');
getDefinedTypes();
getCampuses(); 