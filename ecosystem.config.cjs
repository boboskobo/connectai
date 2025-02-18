const dotenv = require('dotenv');

// Load development environment variables
const devEnv = dotenv.config({ path: '.env.development' }).parsed;

// Load production environment variables
const prodEnv = dotenv.config({ path: '.env' }).parsed;

module.exports = {
  apps: [{
    name: 'connect-rock-integration',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      ...devEnv,
      NODE_ENV: 'development'
    },
    env_production: {
      ...prodEnv,
      NODE_ENV: 'production'
    },
    error_file: 'logs/pm2/error.log',
    out_file: 'logs/pm2/out.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Ensure graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Health monitoring
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
  }]
}; 