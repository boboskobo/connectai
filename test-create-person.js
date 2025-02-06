import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = 'orGdK9QLAQBhFVg0581VuLB3';
const ROCK_BASE_URL = 'https://devrock.flatironschurch.com/api';

async function testCreatePerson() {
    try {
        // First, let's create a test person
        const testPerson = {
            FirstName: "Test",
            LastName: "Person",
            Email: "test@example.com",
            PhoneNumbers: [{
                Number: "1234567890",
                NumberTypeValueId: 12  // Mobile phone type
            }],
            Gender: 2,  // Usually 1 for Male, 2 for Female, 0 for Unknown
            ConnectionStatusValueId: 65,  // Using the value from your screenshot
            CampusId: 1  // We'll need to get the actual campus ID
        };

        const response = await axios.post(`${ROCK_BASE_URL}/People`, testPerson, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Success! Person created:', response.data);
        
    } catch (error) {
        console.error('Error creating person:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

// Run the test
console.log('Testing person creation...');
testCreatePerson(); 