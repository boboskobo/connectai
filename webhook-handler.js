import RockGHLIntegration from './rock-ghl-integration.js';
import logger from './core/logger.js';

class WebhookHandler {
    constructor() {
        this.integration = new RockGHLIntegration();
    }

    validateWebhook(payload, signature) {
        // Add webhook signature validation if needed
        if (!payload) {
            throw new Error('No payload provided');
        }
        return true;
    }

    async handleWebhook(payload, signature) {
        try {
            logger.info('Processing webhook', { type: payload?.type });

            // Validate webhook
            this.validateWebhook(payload, signature);

            // Process based on webhook type
            switch (payload.type) {
                case 'contact.created':
                case 'contact.updated':
                    return await this.handleContactWebhook(payload);
                case 'status.updated':
                    return await this.handleStatusWebhook(payload);
                default:
                    logger.warn('Unhandled webhook type', { type: payload.type });
                    return { status: 'ignored', message: 'Webhook type not handled' };
            }
        } catch (error) {
            logger.error('Error processing webhook', { error: error.stack });
            throw error;
        }
    }

    async handleContactWebhook(payload) {
        try {
            const result = await this.integration.handleContact(payload.data);
            logger.info('Contact processed successfully', { 
                contactId: payload.data?.id,
                result 
            });
            return result;
        } catch (error) {
            logger.error('Error processing contact webhook', { 
                error: error.stack,
                contactId: payload.data?.id 
            });
            throw error;
        }
    }

    async handleStatusWebhook(payload) {
        try {
            const result = await this.integration.handleStatus(payload.data);
            logger.info('Status processed successfully', { 
                contactId: payload.data?.contactId,
                status: payload.data?.status,
                result 
            });
            return result;
        } catch (error) {
            logger.error('Error processing status webhook', { 
                error: error.stack,
                contactId: payload.data?.contactId 
            });
            throw error;
        }
    }
}

export default new WebhookHandler(); 