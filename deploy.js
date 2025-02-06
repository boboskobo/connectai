import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const files = [
    // Core files
    'rock-ghl-integration.js',
    'server.js',
    'logger.js',
    'package.json',
    
    // Test files
    'test-webhook-data.js',
    'test-create-new-person.js',
    'test-rock-connection.js',
    'test-get-enums.js',
    'test-update-status.js',
    'test-create-status.js',
    
    // Setup files
    'setup-church-integration.js',
    'SETUP.md'
];

// Deploy using FTP with proper URL encoding
const deployFile = (file) => {
    // URL encode the password to handle special characters
    const password = encodeURIComponent(process.env.HOSTINGER_PASS);
    
    const command = `curl -T ${file} "ftp://${process.env.HOSTINGER_USER}:${password}@${process.env.HOSTINGER_HOST}${process.env.HOSTINGER_PATH}/${file}"`;
    
    console.log(`Deploying ${file}...`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error deploying ${file}:`, error.message);
            return;
        }
        console.log(`✅ Deployed ${file}`);
    });
};

console.log('Starting deployment...');
files.forEach(deployFile); 