import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = 'orGdK9QLAQBhFVg0581VuLB3';
const ROCK_BASE_URL = 'https://devrock.flatironschurch.com/api';
const CONNECT_APP_STATUS_ID = 1949;

async function testFlexiblePersonCreation() {
    try {
        // Test 1: Required fields only
        console.log('\nTest 1: Required Fields Only');
        const minimalContact = {
            firstName: "Required",
            lastName: "Fields",
            phone: "1234567890"
        };

        // Test 2: All optional fields
        console.log('\nTest 2: All Optional Fields');
        const fullContact = {
            firstName: "Full",
            lastName: "Contact",
            phone: "9876543210",
            email: "full.contact@example.com",
            gender: "Female",
            campus: 1,
            ageRange: 1,
            relationshipStatus: 1
        };

        // Create both test contacts
        const results = await Promise.all([
            createPerson(minimalContact),
            createPerson(fullContact)
        ]);

        console.log('\nResults:');
        console.log('Minimal Contact ID:', results[0]);
        console.log('Full Contact ID:', results[1]);

        // Verify both contacts
        const verifications = await Promise.all([
            verifyPerson(results[0]),
            verifyPerson(results[1])
        ]);

        console.log('\nVerification Results:');
        console.log('Minimal Contact:', verifications[0]);
        console.log('Full Contact:', verifications[1]);

    } catch (error) {
        console.error('Test Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

async function createPerson(contactData) {
    try {
        // Start with required fields
        let personData = {
            FirstName: contactData.firstName,
            LastName: contactData.lastName,
            PhoneNumbers: [{
                Number: contactData.phone,
                NumberTypeValueId: 12
            }],
            ConnectionStatusValueId: CONNECT_APP_STATUS_ID
        };

        // Add optional fields if they exist
        if (contactData.email) personData.Email = contactData.email;
        if (contactData.gender) personData.Gender = contactData.gender === 'Male' ? 1 : 2;
        if (contactData.campus) personData.CampusId = contactData.campus;
        if (contactData.ageRange) personData.AgeBracket = contactData.ageRange;
        if (contactData.relationshipStatus) personData.MaritalStatusValueId = contactData.relationshipStatus;

        const response = await axios.post(`${ROCK_BASE_URL}/People`, personData, {
            headers: {
                'Authorization-Token': ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating person:', error);
        throw error;
    }
}

async function verifyPerson(personId) {
    const response = await axios.get(`${ROCK_BASE_URL}/People/${personId}`, {
        headers: {
            'Authorization-Token': ROCK_API_KEY,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
}

// Run the test
console.log('Testing flexible person creation...');
testFlexiblePersonCreation(); 