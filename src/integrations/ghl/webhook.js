import crypto from 'crypto';
import { logError, logInfo } from '../../utils/logger.js';
import retryQueue from '../../services/retry-queue.js';

class GHLWebhookHandler {
    constructor(rockIntegration, webhookSecret, churchConfig) {
        this.rockIntegration = rockIntegration;
        this.webhookSecret = webhookSecret;
        this.config = churchConfig;
    }

    /**
     * Validate webhook signature
     */
    validateSignature(payload, signature) {
        if (!this.webhookSecret) {
            logInfo('Webhook secret not configured, skipping signature validation');
            return true;
        }

        if (!signature) {
            throw new Error('No signature provided');
        }

        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        const calculatedSignature = hmac
            .update(JSON.stringify(payload))
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(calculatedSignature)
        );
    }

    /**
     * Handle incoming webhook
     */
    async handleWebhook(payload, signature, isRetry = false) {
        try {
            // Validate webhook signature - TEMPORARILY DISABLED
            /*
            if (!isRetry && !this.validateSignature(payload, signature)) {
                throw new Error('Invalid webhook signature');
            }
            */

            await logInfo('Processing webhook', { 
                type: payload?.type,
                churchName: this.config.churchName,
                isRetry 
            });

            // Handle different webhook types
            switch (payload.type) {
                case 'contact.created':
                case 'contact.updated':
                    return await this.handleContactWebhook(payload.data);
                case 'contact.deleted':
                    return await this.handleContactDeleted(payload.data);
                default:
                    await logInfo('Unhandled webhook type', { type: payload.type });
                    return { status: 'ignored', message: 'Webhook type not handled' };
            }
        } catch (error) {
            await logError('Error processing webhook', error);

            // If this isn't already a retry attempt, add to retry queue
            if (!isRetry) {
                await retryQueue.addToQueue(this.config.churchId, payload);
                return { status: 'queued', message: 'Webhook queued for retry' };
            }

            throw error;
        }
    }

    /**
     * Handle contact created/updated webhook
     */
    async handleContactWebhook(data) {
        try {
            // Map GHL contact data to Rock format using church config
            const personData = {
                firstName: this.getFieldValue(data, 'firstName'),
                lastName: this.getFieldValue(data, 'lastName'),
                email: this.getFieldValue(data, 'email'),
                phone: this.getFieldValue(data, 'phone'),
                gender: this.mapGender(this.getFieldValue(data, 'gender')),
                connectionStatusId: this.config.connectionStatusId || 1949,
                campusId: this.mapCampus(this.getFieldValue(data, 'campus'))
            };

            // Create or update person in Rock
            const result = await this.rockIntegration.createOrUpdatePerson(personData);
            
            await logInfo('Contact processed successfully', {
                ghlContactId: data.id,
                rockPersonId: result.Id,
                churchName: this.config.churchName
            });

            return {
                status: 'success',
                rockPersonId: result.Id
            };
        } catch (error) {
            await logError('Error processing contact webhook', error);
            throw error;
        }
    }

    /**
     * Handle contact deleted webhook
     */
    async handleContactDeleted(data) {
        await logInfo('Contact deleted in GHL', { 
            contactId: data.id,
            churchName: this.config.churchName 
        });
        // Note: We don't delete contacts in Rock, just log the event
        return { status: 'success', message: 'Contact deletion logged' };
    }

    /**
     * Get field value using church configuration mapping
     */
    getFieldValue(data, field) {
        const mapping = this.config.fieldMappings[field];
        if (!mapping) return data[field];
        return data[mapping];
    }

    /**
     * Map GHL gender values to Rock values using church configuration
     */
    mapGender(ghlGender) {
        if (!ghlGender) return 0;

        const genderMappings = this.config.customMappings?.gender || {
            'male': 1,
            'female': 2,
            'unknown': 0
        };

        const gender = ghlGender.toLowerCase();
        return genderMappings[gender] || 0;
    }

    /**
     * Map campus using church configuration
     */
    mapCampus(ghlCampus) {
        if (!ghlCampus || !this.config.isMultiCampus) {
            return this.config.defaultCampusId;
        }

        const campusMappings = this.config.customMappings?.campus || {};
        return campusMappings[ghlCampus] || this.config.defaultCampusId;
    }
}

export default GHLWebhookHandler; 