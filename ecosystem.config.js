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
      NODE_ENV: 'development'
    },
    env_production: {
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