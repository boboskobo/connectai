import axios from 'axios';
import { logError, logInfo } from '../../utils/logger.js';

/**
 * Rock RMS API Client
 * Handles all interactions with the Rock RMS REST API
 */
class RockApiClient {
    constructor(baseUrl, apiKey, metrics, churchId) {
        this.metrics = metrics;
        this.churchId = churchId;
        
        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Add response interceptor for error handling and metrics
        this.api.interceptors.response.use(
            response => {
                if (this.metrics) {
                    this.metrics.incrementRockApi(
                        this.churchId,
                        response.config.url,
                        response.config.method,
                        response.status
                    );
                }
                return response;
            },
            error => {
                if (this.metrics) {
                    this.metrics.incrementRockApi(
                        this.churchId,
                        error.config?.url,
                        error.config?.method,
                        error.response?.status || 'error'
                    );
                }
                return this.handleApiError(error);
            }
        );

        // Add request interceptor for timing
        this.api.interceptors.request.use(
            config => {
                if (this.metrics) {
                    config.timer = this.metrics.startRockApiTimer(
                        this.churchId,
                        config.url,
                        config.method
                    );
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Handle API errors consistently
     */
    async handleApiError(error) {
        const errorDetails = {
            message: error.message,
            endpoint: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
        };

        // End timer if it exists
        if (error.config?.timer) {
            error.config.timer();
        }

        await logError('Rock API Error', errorDetails);
        throw error;
    }

    /**
     * Create or update a person in Rock
     */
    async createOrUpdatePerson(personData) {
        try {
            // Check if person exists by phone number
            const existingPerson = await this.findPersonByPhone(personData.phone);
            
            if (existingPerson) {
                await logInfo('Updating existing person', { personId: existingPerson.Id });
                return this.updatePerson(existingPerson.Id, personData);
            }

            await logInfo('Creating new person', { data: personData });
            return this.createPerson(personData);
        } catch (error) {
            await logError('Error in createOrUpdatePerson', error);
            throw error;
        }
    }

    /**
     * Find a person by phone number using OData filter
     */
    async findPersonByPhone(phone) {
        try {
            const filter = encodeURIComponent(`PhoneNumbers/any(p: p/Number eq '${phone}')`);
            const response = await this.api.get(`/api/People?$filter=${filter}&$expand=PhoneNumbers,Family`);
            return response.data[0] || null;
        } catch (error) {
            await logError('Error finding person by phone', error);
            throw error;
        }
    }

    /**
     * Create a new person in Rock
     */
    async createPerson(personData) {
        try {
            // First create the person
            const personResponse = await this.api.post('/api/People', {
                FirstName: personData.firstName,
                LastName: personData.lastName,
                Email: personData.email,
                Gender: personData.gender,
                ConnectionStatusValueId: personData.connectionStatusId || 1949,
                PhoneNumbers: [{
                    Number: personData.phone,
                    NumberTypeValueId: 12, // Mobile phone type
                    IsMessagingEnabled: true
                }]
            });

            const person = personResponse.data;
            await logInfo('Person created', { personId: person.Id });

            // Get the automatically created family
            const familyResponse = await this.api.get(`/api/People/${person.Id}?$expand=Family`);
            const familyId = familyResponse.data.Family.Id;

            // Update the family with the campus
            if (personData.campusId) {
                await this.updateFamily(familyId, {
                    CampusId: personData.campusId
                });
                await logInfo('Family campus updated', { familyId, campusId: personData.campusId });
            }

            return person;
        } catch (error) {
            await logError('Error creating person', error);
            throw error;
        }
    }

    /**
     * Update an existing person in Rock
     */
    async updatePerson(personId, personData) {
        try {
            // Update person
            const personResponse = await this.api.patch(`/api/People/${personId}`, {
                FirstName: personData.firstName,
                LastName: personData.lastName,
                Email: personData.email,
                Gender: personData.gender,
                ConnectionStatusValueId: personData.connectionStatusId || 1949
            });

            // Get family ID
            const familyResponse = await this.api.get(`/api/People/${personId}?$expand=Family`);
            const familyId = familyResponse.data.Family.Id;

            // Update family campus if provided
            if (personData.campusId) {
                await this.updateFamily(familyId, {
                    CampusId: personData.campusId
                });
                await logInfo('Family campus updated', { familyId, campusId: personData.campusId });
            }

            await logInfo('Person updated', { personId });
            return personResponse.data;
        } catch (error) {
            await logError('Error updating person', error);
            throw error;
        }
    }

    /**
     * Update a family in Rock
     */
    async updateFamily(familyId, familyData) {
        try {
            const response = await this.api.patch(`/api/Groups/${familyId}`, {
                CampusId: familyData.CampusId
            });
            await logInfo('Family campus updated', { familyId, campusId: familyData.CampusId });
            return response.data;
        } catch (error) {
            await logError('Error updating family campus', error);
            throw error;
        }
    }

    /**
     * Get defined types (like connection status, etc)
     */
    async getDefinedType(typeId) {
        try {
            const response = await this.api.get(`/api/DefinedTypes/${typeId}`);
            return response.data;
        } catch (error) {
            await logError('Error getting defined type', error);
            throw error;
        }
    }

    /**
     * Get all campuses
     */
    async getCampuses() {
        try {
            const response = await this.api.get('/api/Campuses');
            await logInfo('Retrieved campuses from Rock');
            return response.data;
        } catch (error) {
            await logError('Error getting campuses', error);
            throw error;
        }
    }
}

export default RockApiClient; 