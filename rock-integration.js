const axios = require('axios');
require('dotenv').config();

const ROCK_API_KEY = 'orGdK9QLAQBhFVg0581VuLB3';
const ROCK_BASE_URL = 'https://devrock.flatironschurch.com/api';

class RockIntegration {
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: ROCK_BASE_URL,
            headers: {
                'Authorization': `Bearer ${ROCK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createPerson(contactData) {
        try {
            // First, create the person
            const personResponse = await this.axiosInstance.post('/People', {
                FirstName: contactData.firstName,
                LastName: contactData.lastName,
                Email: contactData.email,
                PhoneNumbers: [{
                    Number: contactData.phone,
                    NumberTypeValueId: 12 // Assuming 12 is Mobile
                }],
                Gender: contactData.gender,
                ConnectionStatusValueId: await this.getConnectionStatusId(contactData.connectionStatus),
                CampusId: await this.getCampusId(contactData.campus)
            });

            console.log('Person created successfully:', personResponse.data);
            return personResponse.data;
        } catch (error) {
            console.error('Error creating person:', error.message);
            if (error.response) {
                console.error('Error Details:', error.response.data);
            }
            throw error;
        }
    }

    async getConnectionStatusId(statusName) {
        try {
            const response = await this.axiosInstance.get('/DefinedValues/GetByDefinedTypeId/12');
            const status = response.data.find(s => s.Value.toLowerCase() === statusName.toLowerCase());
            return status ? status.Id : null;
        } catch (error) {
            console.error('Error fetching connection status:', error.message);
            throw error;
        }
    }

    async getCampusId(campusName) {
        try {
            const response = await this.axiosInstance.get('/Campuses');
            const campus = response.data.find(c => c.Name.toLowerCase() === campusName.toLowerCase());
            return campus ? campus.Id : null;
        } catch (error) {
            console.error('Error fetching campus:', error.message);
            throw error;
        }
    }

    async checkPersonExists(email) {
        try {
            const response = await axios.get(`${ROCK_BASE_URL}/People?$filter=Email eq '${email}'`, {
                headers: {
                    'Authorization-Token': ROCK_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error('Error checking person:', error);
            return null;
        }
    }
}

module.exports = RockIntegration; 