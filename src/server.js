import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

import RockApiClient from './integrations/rock/api.js';
import GHLWebhookHandler from './integrations/ghl/webhook.js';
import churchConfig from './services/church-config.js';
import retryQueue from './services/retry-queue.js';
import logger, { logError, logInfo } from './utils/logger.js';
import { validateEnv } from './utils/validate-env.js';
import { metrics, getMetrics } from './utils/metrics.js';
import adminRoutes from './routes/admin.js';
import ghlOAuth from './services/ghl-oauth.js';

// Load environment variables
dotenv.config();

// Validate environment before proceeding
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Track server start time for uptime calculation
const startTime = new Date();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/webhook', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
    try {
        const uptime = Math.floor((new Date() - startTime) / 1000); // in seconds
        const memory = process.memoryUsage();
        
        // Basic system info
        const healthData = {
            status: 'ok',
            version: process.env.npm_package_version,
            environment: process.env.NODE_ENV,
            uptime,
            timestamp: new Date().toISOString(),
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: {
                    used: Math.round(memory.heapUsed / 1024 / 1024), // MB
                    total: Math.round(memory.heapTotal / 1024 / 1024), // MB
                },
                cpu: os.cpus().length,
                loadAvg: os.loadavg()
            }
        };

        // Check church config service
        try {
            await churchConfig.init();
            healthData.services = {
                ...healthData.services,
                churchConfig: 'ok'
            };
        } catch (error) {
            healthData.services = {
                ...healthData.services,
                churchConfig: 'error'
            };
            healthData.status = 'degraded';
        }

        res.status(200).json(healthData);
    } catch (error) {
        await logError('Health check failed', error);
        res.status(500).json({
            status: 'error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        const metricsData = await getMetrics();
        res.set('Content-Type', register.contentType);
        res.end(metricsData);
    } catch (error) {
        await logError('Error serving metrics', error);
        res.status(500).send('Error collecting metrics');
    }
});

// GHL webhook endpoint with church support and metrics
app.post('/webhook/ghl', async (req, res) => {
    const webhookTimer = metrics.startWebhookTimer(req.query.churchId, req.body?.type);
    
    try {
        const { churchId } = req.query;
        
        if (!churchId) {
            metrics.incrementWebhook(churchId, req.body?.type, 'error');
            throw new Error('Church ID is required');
        }

        // Get church configuration
        const config = await churchConfig.getConfig(churchId);
        if (!config) {
            metrics.incrementWebhook(churchId, req.body?.type, 'error');
            throw new Error('Church configuration not found');
        }

        // Initialize Rock API client with church credentials
        const rockApi = new RockApiClient(
            config.rockRmsUrl,
            config.rockApiKey,
            metrics, // Pass metrics to Rock API client
            churchId // Pass churchId for metrics
        );

        // Initialize webhook handler with church-specific configuration
        const webhookHandler = new GHLWebhookHandler(
            rockApi,
            process.env.GHL_WEBHOOK_SECRET,
            config
        );

        const signature = req.headers['x-ghl-signature'];
        const result = await webhookHandler.handleWebhook(req.body, signature);

        await logInfo('Webhook processed', { 
            churchId,
            type: req.body?.type,
            result 
        });

        metrics.incrementWebhook(churchId, req.body?.type, 'success');
        webhookTimer();
        res.status(200).json(result);
    } catch (error) {
        metrics.incrementWebhook(req.query.churchId, req.body?.type, 'error');
        webhookTimer();
        
        await logError('Webhook processing failed', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// OAuth callback route
app.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            throw new Error('No authorization code received');
        }

        await logInfo('Received OAuth callback', { code });

        // Exchange code for tokens
        const tokens = await ghlOAuth.exchangeCodeForTokens(code);
        
        // Store tokens in church config
        const churchConfig = {
            churchName: `GHL Location ${tokens.locationId}`,
            locationId: tokens.locationId,
            companyId: tokens.companyId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenType: tokens.token_type,
            expiresIn: tokens.expires_in
        };

        // Save the config
        await churchConfig.saveConfig(tokens.locationId, churchConfig);

        await logInfo('OAuth setup complete', { 
            locationId: tokens.locationId,
            companyId: tokens.companyId 
        });

        res.status(200).json({ 
            status: 'success',
            message: 'OAuth setup complete',
            locationId: tokens.locationId
        });
    } catch (error) {
        await logError('OAuth callback failed', error);
        res.status(500).json({ 
            error: 'OAuth callback failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin routes (protected by basic auth)
const basicAuth = (req, res, next) => {
    // Get auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Parse auth header
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');
    const user = auth[0];
    const pass = auth[1];

    // Check credentials
    if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Apply basic auth to admin routes
app.use('/admin', basicAuth, adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logError('Unhandled error', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize services
async function initializeServices() {
    try {
        await churchConfig.init();
        await retryQueue.init();
        await logInfo('Services initialized successfully');
    } catch (error) {
        await logError('Error initializing services', error);
        throw error;
    }
}

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    try {
        await initializeServices();
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        
        // Signal to PM2 that we're ready
        if (process.send) {
            process.send('ready');
        }
    } catch (error) {
        logger.error('Failed to start server properly', error);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Starting graceful shutdown...');
    server.close(() => {
        logger.info('Server closed. Process terminating...');
        process.exit(0);
    });
}); 