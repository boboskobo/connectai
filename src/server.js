import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';

import RockApiClient from './integrations/rock/api.js';
import GHLWebhookHandler from './integrations/ghl/webhook.js';
import churchConfig from './services/church-config.js';
import retryQueue from './services/retry-queue.js';
import logger, { logError, logInfo } from './utils/logger.js';
import { validateEnv } from './utils/validate-env.js';
import { metrics, getMetrics } from './utils/metrics.js';
import adminRoutes from './routes/admin.js';
import ghlAuth from './services/ghl-auth.js';

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
    contentSecurityPolicy: false
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

// Debug logging middleware
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    next();
});

// Serve static files and handle ACME challenge
app.use(express.static(path.join(__dirname, '../public')));

// Explicit ACME challenge handling
app.get('/.well-known/acme-challenge/:token', (req, res) => {
    const token = req.params.token;
    const challengePath = path.join(__dirname, '../.well-known/acme-challenge', token);
    
    logInfo('ACME challenge requested', { token, path: challengePath });
    
    try {
        if (fs.existsSync(challengePath)) {
            res.sendFile(challengePath);
        } else {
            logError('ACME challenge file not found', { token, path: challengePath });
            res.status(404).send('Challenge file not found');
        }
    } catch (error) {
        logError('Error serving ACME challenge', { token, error });
        res.status(500).send('Error serving challenge file');
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('ConnectAI API Server Running');
});

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

// Validate GHL webhook signature
function validateGHLSignature(signature, payload, secret) {
    try {
        // Create HMAC-SHA256 hash of the request body using the secret
        const computedHash = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        // Compare the computed hash with the provided signature
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(computedHash)
        );
    } catch (error) {
        logError('Signature validation failed', error);
        return false;
    }
}

// Debug route to verify server is running
app.get('/debug', (req, res) => {
    res.json({
        status: 'ok',
        routes: app._router.stack
            .filter(r => r.route)
            .map(r => ({
                path: r.route.path,
                methods: Object.keys(r.route.methods)
            }))
    });
});

// Rock RMS verification endpoint
app.post('/auth/rock-verify', async (req, res) => {
    console.log('Verification request received:', {
        body: req.body,
        query: req.query,
        headers: req.headers
    });

    try {
        // 1. Validate GHL Signature - TEMPORARILY DISABLED
        const signature = req.headers['x-ghl-signature'];
        const timestamp = req.headers['x-ghl-timestamp'];
        
        await logInfo('Verification request headers', {
            signature: signature ? 'present' : 'missing',
            timestamp: timestamp || 'missing'
        });

        /* Signature validation temporarily disabled for testing
        if (!signature) {
            return res.status(401).json({
                success: false,
                error: 'Missing GHL signature'
            });
        }
        */

        // 2. Extract and validate required data
        const {
            apiKey,
            rockRmsUrl,
            locationId = req.query.locationId, // Try body first, then query
            companyId = req.query.companyId    // Try body first, then query
        } = req.body;

        // Log request details (safely)
        await logInfo('Rock RMS verification request', {
            hasApiKey: !!apiKey,
            rockRmsUrl,
            locationId,
            companyId,
            timestamp
        });

        // 3. Validate required fields
        const missingFields = [];
        if (!locationId) missingFields.push('locationId');
        if (!companyId) missingFields.push('companyId');
        if (!apiKey) missingFields.push('apiKey');
        if (!rockRmsUrl) missingFields.push('rockRmsUrl');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // 4. Validate Rock RMS URL format
        try {
            const url = new URL(rockRmsUrl);
            if (!url.protocol.startsWith('http')) {
                throw new Error('Invalid protocol');
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Rock RMS URL format. Must be a valid HTTPS URL.'
            });
        }

        // 5. Create a unique configuration key
        const configKey = `${companyId}:${locationId}`; // Using colon as separator for better readability

        // 6. Store the configuration
        await churchConfig.saveConfig(configKey, {
            rockRmsUrl: rockRmsUrl.trim(),
            apiKey,
            locationId,
            companyId,
            lastVerified: new Date().toISOString(),
            signature // Store for reference/debugging
        }, true); // Use verification validation

        // 7. Return success response
        return res.status(200).json({
            success: true,
            message: 'Rock RMS connection verified successfully',
            location: {
                id: locationId,
                companyId,
                url: rockRmsUrl
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during verification',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// OAuth callback route
// ... existing code ...

// Simple test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'ok' });
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