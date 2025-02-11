import dotenv from 'dotenv';
import churchConfig from '../services/church-config.js';
import { logInfo } from '../utils/logger.js';

// Load environment variables
dotenv.config();

async function setupTestChurch() {
    try {
        console.log('🔧 Setting up test church configuration...');

        // Initialize church config service
        await churchConfig.init();

        // Create test configuration
        const testConfig = {
            churchId: 'test-church',
            churchName: 'Test Church',
            rockRmsUrl: 'http://localhost:3001/mock-rock',
            rockApiKey: 'test-api-key',
            defaultCampusId: 1,
            isMultiCampus: false,
            connectionStatusId: 1949,
            fieldMappings: {
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                phone: 'phone',
                gender: 'gender',
                campus: 'location'
            },
            customMappings: {
                gender: {
                    'male': 1,
                    'female': 2,
                    'unknown': 0
                },
                campus: {
                    'Main Campus': 1
                }
            }
        };

        // Save test configuration
        await churchConfig.saveConfig('test-church', testConfig);

        console.log('\n✅ Test church configured successfully!');
        console.log('Configuration:', JSON.stringify(testConfig, null, 2));

        // Log success
        await logInfo('Test church configuration created', { churchId: 'test-church' });
    } catch (error) {
        console.error('\n❌ Error setting up test church:');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the setup
setupTestChurch(); 