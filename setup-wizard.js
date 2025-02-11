import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function setupChurch() {
    try {
        const rockApi = axios.create({
            baseURL: process.env.ROCK_BASE_URL,
            headers: {
                'Authorization-Token': process.env.ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Get campuses
        const campuses = await rockApi.get('/Campuses');
        console.log('\nFound these campuses:');
        campuses.data.forEach(c => console.log(`${c.Name}: ID ${c.Id}`));

        // Get ACTUAL marital statuses (DefinedType 4 is Connection Status, we want MaritalStatus)
        const maritalStatuses = await rockApi.get('/DefinedValues?$filter=DefinedTypeId eq 40');
        console.log('\nFound these marital statuses:');
        maritalStatuses.data.forEach(s => console.log(`${s.Value}: ID ${s.Id}`));

        // Get connection statuses
        const connectionStatuses = await rockApi.get('/DefinedValues?$filter=DefinedTypeId eq 4');
        console.log('\nFound these connection statuses:');
        connectionStatuses.data.forEach(s => console.log(`${s.Value}: ID ${s.Id}`));

        console.log('\nGender IDs:');
        console.log('Male: 1');
        console.log('Female: 2');

    } catch (error) {
        console.error('Setup failed:', error.message);
    }
}

setupChurch(); 