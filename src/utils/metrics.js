import client from 'prom-client';
import { logInfo } from './logger.js';

// Create a Registry to store metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc)
client.collectDefaultMetrics({ register });

// Custom metrics
const webhookCounter = new client.Counter({
    name: 'ghl_webhooks_total',
    help: 'Count of GHL webhooks received',
    labelNames: ['church_id', 'type', 'status']
});

const webhookDuration = new client.Histogram({
    name: 'ghl_webhook_duration_seconds',
    help: 'Webhook processing duration',
    labelNames: ['church_id', 'type']
});

const rockApiCounter = new client.Counter({
    name: 'rock_api_calls_total',
    help: 'Count of Rock API calls',
    labelNames: ['church_id', 'endpoint', 'method', 'status']
});

const rockApiDuration = new client.Histogram({
    name: 'rock_api_duration_seconds',
    help: 'Rock API call duration',
    labelNames: ['church_id', 'endpoint', 'method']
});

// Register custom metrics
register.registerMetric(webhookCounter);
register.registerMetric(webhookDuration);
register.registerMetric(rockApiCounter);
register.registerMetric(rockApiDuration);

export const metrics = {
    // Webhook metrics
    incrementWebhook: (churchId, type, status) => {
        webhookCounter.labels(churchId, type, status).inc();
    },

    startWebhookTimer: (churchId, type) => {
        return webhookDuration.startTimer({ church_id: churchId, type });
    },

    // Rock API metrics
    incrementRockApi: (churchId, endpoint, method, status) => {
        rockApiCounter.labels(churchId, endpoint, method, status).inc();
    },

    startRockApiTimer: (churchId, endpoint, method) => {
        return rockApiDuration.startTimer({ church_id: churchId, endpoint, method });
    }
};

// Metrics endpoint data
export async function getMetrics() {
    try {
        const metrics = await register.metrics();
        await logInfo('Metrics collected successfully');
        return metrics;
    } catch (error) {
        await logError('Error collecting metrics', error);
        throw error;
    }
} 