import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import { logError, logInfo } from './logger.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv
dotenv.config();

class ChurchSetup {
    constructor(apiKey, baseUrl) {
        this.rockApi = axios.create({
            baseURL: baseUrl,
            headers: {
                'Authorization-Token': apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    async setup() {
        try {
            await logInfo('Starting church setup...');

            await this.testConnection();
            await logInfo('✅ Connection successful');

            const statusId = await this.setupConnectionStatus();
            await logInfo(`✅ Connection status configured: ${statusId}`);

            const campuses = await this.getCampuses();
            await logInfo(`✅ Found campuses: ${campuses.length}`);

            const config = {
                connectionStatusId: statusId,
                campuses: campuses,
                apiKey: process.env.ROCK_API_KEY,
                baseUrl: process.env.ROCK_BASE_URL
            };

            await this.saveConfig(config);
            await logInfo('✅ Configuration saved');

            return config;
        } catch (error) {
            await logError(error, 'setup');
            throw error;
        }
    }

    async testConnection() {
        try {
            await this.rockApi.get('/People/1');
            return true;
        } catch (error) {
            throw new Error('Connection test failed: ' + error.message);
        }
    }

    async setupConnectionStatus() {
        try {
            // Check if status exists
            const response = await this.rockApi.get('/DefinedValues', {
                params: {
                    $filter: "DefinedTypeId eq 4 and Value eq 'Connect App Contact'"
                }
            });

            if (response.data.length > 0) {
                return response.data[0].Id;
            }

            // Create new status
            const newStatus = {
                DefinedTypeId: 4,
                Value: 'Connect App Contact',
                Description: 'Contact created through Connect App integration',
                Order: 0,
                IsSystem: false,
                IsActive: true
            };

            const createResponse = await this.rockApi.post('/DefinedValues', newStatus);
            return createResponse.data.Id;
        } catch (error) {
            throw new Error('Status setup failed: ' + error.message);
        }
    }

    async getCampuses() {
        try {
            const response = await this.rockApi.get('/Campuses');
            return response.data.map(campus => ({
                id: campus.Id,
                name: campus.Name,
                isActive: campus.IsActive
            }));
        } catch (error) {
            throw new Error('Campus fetch failed: ' + error.message);
        }
    }

    async saveConfig(config) {
        const configPath = './church-config.json';
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }
}

// Run setup if executed directly
if (process.argv[1].includes('setup-church-integration.js')) {
    console.log('Running church setup...');
    const setup = new ChurchSetup(process.env.ROCK_API_KEY, process.env.ROCK_BASE_URL);
    setup.setup()
        .then(config => {
            console.log('\nSetup completed successfully!');
            console.log('Configuration:', config);
        })
        .catch(error => {
            console.error('\nSetup failed:', error.message);
            process.exit(1);
        });
}

export default ChurchSetup; 