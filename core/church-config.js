// Core Church Configuration Module
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ChurchConfig {
    constructor() {
        this.config = null;
        this.configPath = path.join(__dirname, '..', 'church-config.json');
    }

    // Load church configuration
    async load() {
        try {
            const configData = await fs.promises.readFile(this.configPath, 'utf8');
            this.config = JSON.parse(configData);
            return this.config;
        } catch (error) {
            console.error('Error loading church configuration:', error);
            throw error;
        }
    }

    // Get specific configuration value
    get(key) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call load() first.');
        }
        return this.config[key];
    }

    // Update configuration
    async update(updates) {
        try {
            this.config = { ...this.config, ...updates };
            await fs.promises.writeFile(
                this.configPath,
                JSON.stringify(this.config, null, 2)
            );
            return this.config;
        } catch (error) {
            console.error('Error updating church configuration:', error);
            throw error;
        }
    }

    // Validate configuration
    validate() {
        const requiredFields = [
            'churchName',
            'rockRmsUrl',
            'rockApiKey',
            'defaultCampusId',
            'statusMappings',
            'fieldMappings'
        ];

        const missing = requiredFields.filter(field => !this.config?.[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required configuration fields: ${missing.join(', ')}`);
        }

        return true;
    }

    // Get field mappings
    getFieldMappings() {
        return this.config?.fieldMappings || {};
    }

    // Get status mappings
    getStatusMappings() {
        return this.config?.statusMappings || {};
    }

    // Get Rock RMS configuration
    getRockConfig() {
        return {
            baseUrl: this.config?.rockRmsUrl,
            apiKey: this.config?.rockApiKey,
            defaultCampusId: this.config?.defaultCampusId
        };
    }
}

// Export singleton instance
export default new ChurchConfig(); 