import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function getEnums() {
    try {
        const rockApi = axios.create({
            baseURL: process.env.ROCK_BASE_URL,
            headers: {
                'Authorization-Token': process.env.ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Get all defined types
        const types = await rockApi.get('/DefinedTypes');
        console.log('\nDefined Types:');
        types.data.forEach(t => console.log(`${t.Name}: ID ${t.Id}`));

        // This will help us find the correct type IDs
    } catch (error) {
        console.error('Failed:', error.message);
    }
}

getEnums(); 