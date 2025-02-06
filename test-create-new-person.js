import RockGHLIntegration from './rock-ghl-integration.js';
import { sampleWebhook } from './test-webhook-data.js';

async function testCreatePerson() {
    try {
        const integration = new RockGHLIntegration();
        console.log('Creating test person...');
        const result = await integration.createPerson(sampleWebhook);
        console.log('Person created:', result);
    } catch (error) {
        console.error('Failed to create person:', error.message);
    }
}

testCreatePerson(); 