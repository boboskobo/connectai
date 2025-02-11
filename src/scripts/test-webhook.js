import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample contact data
const sampleWebhook = {
    type: 'contact.created',
    data: {
        id: 'test-123',
        firstName: 'John',
        lastName: 'Test',
        email: 'john.test@example.com',
        phone: '1234567890',
        location: 'Main Campus' // This will map to campus
    }
};

// Create signature like GHL would
const signature = crypto
    .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET)
    .update(JSON.stringify(sampleWebhook))
    .digest('hex');

async function testWebhook() {
    try {
        console.log('🚀 Sending test webhook...');
        console.log('Payload:', JSON.stringify(sampleWebhook, null, 2));

        const response = await axios.post(
            `http://localhost:${process.env.PORT}/webhook/ghl?churchId=test-church`,
            sampleWebhook,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-ghl-signature': signature
                }
            }
        );

        console.log('\n✅ Webhook processed successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('\n❌ Error testing webhook:');
        if (error.response) {
            console.error('Response:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testWebhook(); 