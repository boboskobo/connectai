import RockGHLIntegration from './rock-ghl-integration.js';
import { sampleWebhook } from './test-webhook-data.js';
import { logInfo } from './logger.js';

async function testFullIntegration() {
    try {
        const integration = new RockGHLIntegration();

        // 1. Test connection
        await logInfo('Testing Rock RMS connection...');
        await integration.rockApi.get('/People/1');
        
        // 2. Test webhook handling
        await logInfo('Testing webhook handling...');
        const result = await integration.handleContact(sampleWebhook);
        
        await logInfo('Test complete! Person created:', result);
        return result;
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
}

// Run test
testFullIntegration(); 