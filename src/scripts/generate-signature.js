import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

// The webhook secret from your environment
const secret = process.env.GHL_WEBHOOK_SECRET;

// The test payload
const payload = {
    rockRmsUrl: "https://devrock.flatironschurch.com",
    apiKey: "orGdK9QLAQBhFVg0581VuLB3",
    locationId: "123",
    companyId: "456"
};

// Compute the signature
const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

console.log('Use this signature in your x-ghl-signature header:');
console.log(signature);

// Print the full curl command for easy testing
console.log('\nFull curl command:');
console.log(`curl -X POST http://localhost:3000/auth/rock-verify \\
  -H "Content-Type: application/json" \\
  -H "x-ghl-signature: ${signature}" \\
  -d '${JSON.stringify(payload)}'`); 