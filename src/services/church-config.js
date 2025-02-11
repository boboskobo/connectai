import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChurchConfigService {
    constructor() {
        this.configDir = path.join(__dirname, '../../config/churches');
    }

    /**
     * Initialize configuration directory
     */
    async init() {
        try {
            await fs.mkdir(this.configDir, { recursive: true });
            await logInfo('Church config directory initialized');
        } catch (error) {
            await logError('Error initializing church config directory', error);
            throw error;
        }
    }

    /**
     * Get church configuration by ID
     */
    async getConfig(churchId) {
        try {
            const configPath = path.join(this.configDir, `${churchId}.json`);
            const configData = await fs.readFile(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            await logError('Error reading church config', error);
            throw error;
        }
    }

    /**
     * Save church configuration
     */
    async saveConfig(churchId, config) {
        try {
            await this.validateConfig(config);
            
            const configPath = path.join(this.configDir, `${churchId}.json`);
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            
            await logInfo('Church config saved', { churchId });
            return true;
        } catch (error) {
            await logError('Error saving church config', error);
            throw error;
        }
    }

    /**
     * Delete church configuration
     */
    async deleteConfig(churchId) {
        try {
            const configPath = path.join(this.configDir, `${churchId}.json`);
            await fs.unlink(configPath);
            
            await logInfo('Church config deleted', { churchId });
            return true;
        } catch (error) {
            await logError('Error deleting church config', error);
            throw error;
        }
    }

    /**
     * List all church configurations
     */
    async listConfigs() {
        try {
            const files = await fs.readdir(this.configDir);
            const configs = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const churchId = file.replace('.json', '');
                    const config = await this.getConfig(churchId);
                    if (config) {
                        configs.push({ churchId, ...config });
                    }
                }
            }
            
            return configs;
        } catch (error) {
            await logError('Error listing church configs', error);
            throw error;
        }
    }

    /**
     * Validate church configuration
     */
    async validateConfig(config) {
        const requiredFields = [
            'churchName',
            'rockRmsUrl',
            'rockApiKey',
            'defaultCampusId',
            'fieldMappings'
        ];

        const missing = requiredFields.filter(field => !config[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required configuration fields: ${missing.join(', ')}`);
        }

        // Validate field mappings
        if (!config.fieldMappings.firstName || !config.fieldMappings.lastName) {
            throw new Error('First name and last name mappings are required');
        }

        return true;
    }

    /**
     * Get default configuration template
     */
    getDefaultConfig() {
        return {
            churchName: '',
            rockRmsUrl: '',
            rockApiKey: '',
            defaultCampusId: 1,
            connectionStatusId: 1949,
            fieldMappings: {
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                phone: 'phone',
                gender: 'gender',
                campus: 'campus'
            },
            customMappings: {
                gender: {
                    'male': 1,
                    'female': 2,
                    'unknown': 0
                },
                campus: {}
            }
        };
    }
}

export default new ChurchConfigService(); 