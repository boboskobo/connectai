import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logError, logInfo } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RetryQueue {
    constructor() {
        this.queueDir = path.join(__dirname, '../../data/retry-queue');
        this.maxRetries = 5;
        this.retryDelays = [
            1 * 60 * 1000,  // 1 minute
            5 * 60 * 1000,  // 5 minutes
            15 * 60 * 1000, // 15 minutes
            30 * 60 * 1000, // 30 minutes
            60 * 60 * 1000  // 1 hour
        ];
    }

    async init() {
        try {
            await fs.mkdir(this.queueDir, { recursive: true });
            await logInfo('Retry queue directory initialized');
            
            // Start processing retries
            this.startProcessing();
        } catch (error) {
            await logError('Error initializing retry queue', error);
            throw error;
        }
    }

    async addToQueue(churchId, webhookData, attempt = 1) {
        try {
            const timestamp = Date.now();
            const filename = `${timestamp}-${churchId}-${attempt}.json`;
            const filePath = path.join(this.queueDir, filename);

            const queueEntry = {
                churchId,
                webhookData,
                attempt,
                timestamp,
                nextRetry: timestamp + this.retryDelays[attempt - 1]
            };

            await fs.writeFile(filePath, JSON.stringify(queueEntry, null, 2));
            
            await logInfo('Added webhook to retry queue', {
                churchId,
                attempt,
                nextRetry: new Date(queueEntry.nextRetry).toISOString()
            });

            if (metrics) {
                metrics.incrementWebhook(churchId, webhookData.type, 'queued');
            }

            return queueEntry;
        } catch (error) {
            await logError('Error adding to retry queue', error);
            throw error;
        }
    }

    async processRetry(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const entry = JSON.parse(content);

            // Check if it's time to retry
            if (Date.now() < entry.nextRetry) {
                return false;
            }

            await logInfo('Processing retry', {
                churchId: entry.churchId,
                attempt: entry.attempt
            });

            // Import handlers dynamically to avoid circular dependencies
            const { default: GHLWebhookHandler } = await import('../integrations/ghl/webhook.js');
            const { default: RockApiClient } = await import('../integrations/rock/api.js');
            const { default: churchConfig } = await import('./church-config.js');

            // Get church configuration
            const config = await churchConfig.getConfig(entry.churchId);
            if (!config) {
                throw new Error('Church configuration not found');
            }

            // Initialize Rock API client
            const rockApi = new RockApiClient(
                config.rockRmsUrl,
                config.rockApiKey,
                metrics,
                entry.churchId
            );

            // Initialize webhook handler
            const webhookHandler = new GHLWebhookHandler(
                rockApi,
                process.env.GHL_WEBHOOK_SECRET,
                config
            );

            // Try processing the webhook
            await webhookHandler.handleWebhook(entry.webhookData);

            // If successful, remove from queue
            await fs.unlink(filePath);
            
            await logInfo('Retry processed successfully', {
                churchId: entry.churchId,
                attempt: entry.attempt
            });

            if (metrics) {
                metrics.incrementWebhook(entry.churchId, entry.webhookData.type, 'retry_success');
            }

            return true;
        } catch (error) {
            const entry = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            // If max retries reached, move to dead letter queue
            if (entry.attempt >= this.maxRetries) {
                await this.moveToDeadLetter(filePath);
                return true;
            }

            // Otherwise, queue next retry
            await this.addToQueue(
                entry.churchId,
                entry.webhookData,
                entry.attempt + 1
            );
            await fs.unlink(filePath);

            await logError('Retry attempt failed', {
                error,
                churchId: entry.churchId,
                attempt: entry.attempt
            });

            if (metrics) {
                metrics.incrementWebhook(entry.churchId, entry.webhookData.type, 'retry_failed');
            }

            return true;
        }
    }

    async moveToDeadLetter(filePath) {
        try {
            const deadLetterDir = path.join(this.queueDir, 'dead-letter');
            await fs.mkdir(deadLetterDir, { recursive: true });

            const filename = path.basename(filePath);
            const deadLetterPath = path.join(deadLetterDir, filename);

            await fs.rename(filePath, deadLetterPath);
            
            const entry = JSON.parse(await fs.readFile(deadLetterPath, 'utf8'));
            await logError('Webhook moved to dead letter queue', {
                churchId: entry.churchId,
                attempts: entry.attempt
            });

            if (metrics) {
                metrics.incrementWebhook(entry.churchId, entry.webhookData.type, 'dead_letter');
            }
        } catch (error) {
            await logError('Error moving to dead letter queue', error);
            throw error;
        }
    }

    async startProcessing() {
        try {
            // Process retries every minute
            setInterval(async () => {
                const files = await fs.readdir(this.queueDir);
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(this.queueDir, file);
                        await this.processRetry(filePath);
                    }
                }
            }, 60000);

            await logInfo('Retry queue processor started');
        } catch (error) {
            await logError('Error in retry queue processor', error);
        }
    }
}

export default new RetryQueue(); 