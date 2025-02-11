import { exec } from 'child_process';
import { promisify } from 'util';
import { logError, logInfo } from '../utils/logger.js';

const execAsync = promisify(exec);

async function deploy() {
    try {
        console.log('Starting deployment...');

        // Create necessary directories
        console.log('\nCreating directories...');
        await execAsync('mkdir -p logs/pm2 config/churches');

        // Install production dependencies
        console.log('\nInstalling production dependencies...');
        await execAsync('npm ci --production');

        // Build the application
        console.log('\nBuilding application...');
        await execAsync('npm run build');

        // Start or reload PM2
        console.log('\nStarting application with PM2...');
        try {
            // Try to reload if already running
            await execAsync('pm2 reload ecosystem.config.cjs --env production');
            console.log('Application reloaded successfully');
        } catch (error) {
            // If not running, start it
            await execAsync('pm2 start ecosystem.config.cjs --env production');
            console.log('Application started successfully');
        }

        // Save PM2 configuration
        await execAsync('pm2 save');

        console.log('\n✓ Deployment completed successfully');
        await logInfo('Deployment completed');

    } catch (error) {
        console.error('\n✗ Deployment failed:', error.message);
        await logError('Deployment failed', error);
        process.exit(1);
    }
}

// Run deployment
deploy(); 