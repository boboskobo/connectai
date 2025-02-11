import axios from 'axios';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from './logger.js';
import { churchConfigs } from './church-config.js';

// Configure dotenv
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const ROCK_API_KEY = 'orGdK9QLAQBhFVg0581VuLB3';
const ROCK_BASE_URL = 'https://devrock.flatironschurch.com/api';
const CONNECT_APP_STATUS_ID = 1949;

class RockGHLIntegration {
    constructor() {
        this.rockApi = axios.create({
            baseURL: process.env.ROCK_BASE_URL,
            headers: {
                'Authorization-Token': process.env.ROCK_API_KEY,
                'Content-Type': 'application/json'
            }
        });
    }

    async handleContact(contactData) {
        // Just pass through the IDs they send
        let personData = {
            FirstName: contactData.firstName,
            LastName: contactData.lastName,
            PhoneNumbers: [{
                Number: contactData.phone,
                NumberTypeValueId: 12
            }],
            ConnectionStatusValueId: 1949,
            // Use their IDs directly
            CampusId: contactData.campusId,
            MaritalStatusValueId: contactData.maritalStatusId,
            Gender: contactData.genderId
        };

        // Create or update person
        return await this.createPerson(personData);
    }

    async createPerson(contactData) {
        try {
            // Basic person data
            let personData = {
                FirstName: contactData.firstName,
                LastName: contactData.lastName,
                PhoneNumbers: [{
                    Number: contactData.phone,
                    NumberTypeValueId: 12
                }],
                ConnectionStatusValueId: 1949
            };

            // Add any other fields that exist
            if (contactData.email) personData.Email = contactData.email;
            if (contactData.gender) personData.Gender = this.mapGender(contactData.gender);
            if (contactData.campus) personData.CampusId = contactData.campus;
            if (contactData.maritalStatus) personData.MaritalStatusValueId = contactData.maritalStatus;

            const response = await this.rockApi.post('/People', personData);
            await logInfo('Person created:', response.data);
            return response.data;
        } catch (error) {
            await logError(error, 'createPerson');
            throw error;
        }
    }

    // Simple gender mapping
    mapGender(gender) {
        if (typeof gender === 'number') return gender;
        return gender.toLowerCase() === 'male' ? 1 : 
               gender.toLowerCase() === 'female' ? 2 : 0;
    }

    async updatePerson(personId, contactData) {
        try {
            let updateData = {
                FirstName: contactData.firstName,
                LastName: contactData.lastName,
                ConnectionStatusValueId: 1949
            };

            // Add optional fields if they exist
            if (contactData.email) updateData.Email = contactData.email;
            if (contactData.gender) updateData.Gender = this.mapGender(contactData.gender);
            if (contactData.maritalStatus && this.config.maritalStatus) {
                const status = this.config.maritalStatus[contactData.maritalStatus];
                if (status) {
                    updateData.MaritalStatusValueId = status.rockId;
                    updateData.HasChildren = status.hasChildren;
                }
            }
            if (contactData.ageRange) updateData.AgeRange = RockGHLIntegration.AGE_RANGE_MAP[contactData.ageRange];
            if (contactData.campus && this.config.campuses) {
                const campusId = Object.keys(this.config.campuses)
                    .find(key => this.config.campuses[key] === contactData.campus);
                if (campusId) updateData.CampusId = parseInt(campusId);
            }

            const response = await this.rockApi.patch(`/People/${personId}`, updateData);
            await logInfo(`Person updated: ${personId}`);
            return response.data;
        } catch (error) {
            await logError(error, 'updatePerson');
            throw error;
        }
    }

    async checkPersonExists(phone) {
        try {
            const response = await this.rockApi.get(`/People/Search?searchterm=${phone}`);
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            await logError(error, 'checkPersonExists');
            return null;
        }
    }

    // Field mappings
    static CAMPUS_MAP = {
        '1': 'Lafayette',
        '2': 'Longmont',
        '3': 'Denver',
        '4': 'Aurora',
        '5': 'West',
        '6': 'Online'
    };

    static MARITAL_STATUS_MAP = {
        '1': 'Single',
        '2': 'Married',
        '3': 'Single w/ kiddos',
        '4': 'Married w/ kiddos'
    };

    static GENDER_MAP = {
        '1': 1,  // Male
        '2': 2   // Female
    };

    static AGE_RANGE_MAP = {
        '1': 'under 18',
        '2': '18-25',
        '3': '26-35',
        '4': '36-45',
        '5': '46-54',
        '6': '55 plus'
    };
}

export default RockGHLIntegration; 