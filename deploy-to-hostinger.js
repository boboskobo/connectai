import * as ftp from 'basic-ftp';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Deployment stats
let stats = {
    filesUploaded: 0,
    totalFiles: 0,
    startTime: null,
    errors: []
};

// Add logging levels
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// Deployment configuration
const config = {
    ftp: {
        host: 'ftp.connectai.click',
        user: 'u166621223',
        password: '$MBMB1jb',
        secure: false,
        retries: 3,
        timeout: 30000
    },
    logging: {
        level: LOG_LEVELS.INFO,  // Change to DEBUG for verbose FTP output
        logToFile: true,
        logFile: 'deployment.log'
    },
    paths: {
        remote: '/public_html',
        storage: 'storage',
        public: 'public'
    },
    // Critical files to verify after deployment
    criticalPaths: [
        'public/index.php',
        '.env',
        'storage',
        'bootstrap/cache'
    ],
    excludedPaths: [
        'node_modules',
        '.git',
        '.env',
        '.env.example',
        'storage/logs',
        'storage/framework/cache',
        'storage/framework/sessions',
        'storage/framework/views',
        'storage/app/public',
        'tests',
        'deploy-to-hostinger.js'
    ],
    specialPermissions: {
        directories: {
            'storage': '775',
            'storage/framework': '775',
            'storage/framework/cache': '775',
            'storage/framework/sessions': '775',
            'storage/framework/views': '775',
            'storage/logs': '775',
            'bootstrap/cache': '775'
        },
        files: {
            '.env': '644',
            'artisan': '755'
        }
    }
};

// Logging utility
function log(level, message, error = null) {
    if (level > config.logging.level) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Console output
    switch(level) {
        case LOG_LEVELS.ERROR:
            console.error(logMessage);
            if (error) console.error(error);
            break;
        case LOG_LEVELS.WARN:
            console.warn(logMessage);
            break;
        default:
            console.log(logMessage);
    }
    
    // File logging
    if (config.logging.logToFile) {
        const logEntry = `${logMessage}${error ? '\n' + error.stack : ''}\n`;
        fs.appendFileSync(config.logging.logFile, logEntry);
    }
}

async function retryOperation(operation, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (err) {
            lastError = err;
            console.log(`Attempt ${attempt} failed, retrying... (${maxRetries - attempt} attempts remaining)`);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
            }
        }
    }
    throw lastError;
}

async function ensureDirectoryExists(client, dir) {
    try {
        await client.ensureDir(dir);
    } catch (err) {
        console.error(`Error creating directory ${dir}:`, err.message);
        throw err;
    }
}

async function uploadFile(client, localPath, remotePath) {
    return retryOperation(async () => {
        try {
            await client.uploadFrom(localPath, remotePath);
            stats.filesUploaded++;
            const progress = ((stats.filesUploaded / stats.totalFiles) * 100).toFixed(1);
            log(LOG_LEVELS.INFO, `[${progress}%] Uploaded: ${path.basename(remotePath)}`);
            log(LOG_LEVELS.DEBUG, `Full path: ${remotePath}`);
        } catch (err) {
            stats.errors.push({ file: remotePath, error: err.message });
            log(LOG_LEVELS.ERROR, `Failed to upload: ${remotePath}`, err);
            throw err;
        }
    });
}

async function setPermissions(client, path, permissions) {
    try {
        await client.send('SITE CHMOD ' + permissions + ' ' + path);
        console.log(`Set permissions ${permissions} for ${path}`);
    } catch (err) {
        console.error(`Error setting permissions for ${path}:`, err.message);
    }
}

async function uploadDirectory(client, localPath, remotePath) {
    const items = fs.readdirSync(localPath);
    
    for (const item of items) {
        const localItemPath = path.join(localPath, item);
        const remoteItemPath = path.join(remotePath, item).replace(/\\/g, '/');
        
        // Skip excluded paths
        if (config.excludedPaths.some(excluded => localItemPath.includes(excluded))) {
            continue;
        }

        const stats = fs.statSync(localItemPath);
        
        if (stats.isDirectory()) {
            await ensureDirectoryExists(client, remoteItemPath);
            await uploadDirectory(client, localItemPath, remoteItemPath);
            
            // Set special permissions for directories if needed
            if (config.specialPermissions.directories[item]) {
                await setPermissions(client, remoteItemPath, config.specialPermissions.directories[item]);
            }
        } else {
            await uploadFile(client, localItemPath, remoteItemPath);
            
            // Set special permissions for files if needed
            if (config.specialPermissions.files[item]) {
                await setPermissions(client, remoteItemPath, config.specialPermissions.files[item]);
            }
        }
    }
}

async function createSymlink(client, targetPath, linkPath) {
    try {
        await client.send('SITE SYMLINK ' + targetPath + ' ' + linkPath);
        console.log(`Created symlink from ${targetPath} to ${linkPath}`);
    } catch (err) {
        console.error(`Error creating symlink:`, err.message);
    }
}

// Count total files to upload
function countFiles(dir) {
    let count = 0;
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const itemPath = path.join(dir, item);
        if (config.excludedPaths.some(excluded => itemPath.includes(excluded))) continue;
        
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            count += countFiles(itemPath);
        } else {
            count++;
        }
    }
    return count;
}

async function verifyDeployment(client) {
    console.log('\nVerifying deployment...');
    const issues = [];

    for (const criticalPath of config.criticalPaths) {
        try {
            await client.size(path.join(config.paths.remote, criticalPath));
            console.log(`✓ Verified ${criticalPath}`);
        } catch (err) {
            issues.push(`✗ Missing or inaccessible: ${criticalPath}`);
        }
    }

    return issues;
}

async function deployToHostinger() {
    const client = new ftp.Client();
    client.ftp.verbose = config.logging.level === LOG_LEVELS.DEBUG;
    stats.startTime = Date.now();
    
    try {
        log(LOG_LEVELS.INFO, 'Starting deployment process...');
        
        // Count total files
        stats.totalFiles = countFiles('.');
        log(LOG_LEVELS.INFO, `Found ${stats.totalFiles} files to upload`);

        // Connect to FTP with retries
        await retryOperation(async () => {
            log(LOG_LEVELS.INFO, 'Connecting to FTP server...');
            await client.access(config.ftp);
            log(LOG_LEVELS.INFO, 'Connected successfully');
        });

        // Create main directories if they don't exist
        await ensureDirectoryExists(client, config.paths.remote);
        
        // Upload files
        log(LOG_LEVELS.INFO, 'Uploading files...');
        await uploadDirectory(client, '.', config.paths.remote);
        
        // Post-deployment tasks
        log(LOG_LEVELS.INFO, '\nRunning post-deployment tasks...');
        
        // Ensure storage directory exists and has correct permissions
        const storageDir = path.join(config.paths.remote, 'storage');
        await ensureDirectoryExists(client, storageDir);
        await setPermissions(client, storageDir, '775');
        
        // Create storage symlink if it doesn't exist
        const publicStorageDir = path.join(config.paths.remote, 'public/storage');
        const storageTarget = path.join(config.paths.remote, 'storage/app/public');
        await createSymlink(client, storageTarget, publicStorageDir);

        // Verify deployment
        const issues = await verifyDeployment(client);
        
        // Enhanced deployment summary
        const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
        const summary = [
            '\nDeployment Summary:',
            `Duration: ${duration} seconds`,
            `Files Uploaded: ${stats.filesUploaded}/${stats.totalFiles}`,
            `Errors: ${stats.errors.length}`,
            `Log File: ${config.logging.logFile}`
        ];

        if (issues.length > 0) {
            summary.push('\nWarnings:');
            issues.forEach(issue => summary.push(`  ${issue}`));
        }
        
        if (stats.errors.length > 0) {
            summary.push('\nError Details:');
            stats.errors.forEach(({file, error}) => 
                summary.push(`  ${file}: ${error}`));
        }

        log(LOG_LEVELS.INFO, summary.join('\n'));
        
    } catch (err) {
        log(LOG_LEVELS.ERROR, 'Deployment failed', err);
        throw err;
    } finally {
        client.close();
    }
}

// Run deployment
deployToHostinger().catch(err => {
    console.error('Deployment script failed:', err);
    process.exit(1);
}); 