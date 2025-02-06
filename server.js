import express from 'express';
import bodyParser from 'body-parser';
import RockGHLIntegration from './rock-ghl-integration.js';
import { logInfo, logError } from './logger.js';

const app = express();
app.use(bodyParser.json());

// Webhook endpoint
app.post('/api/webhook', async (req, res) => {
    try {
        await logInfo('Received webhook:', req.body);
        
        const integration = new RockGHLIntegration();
        const result = await integration.handleContact(req.body);
        
        res.json({ success: true, data: result });
    } catch (error) {
        await logError(error, 'webhook');
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 