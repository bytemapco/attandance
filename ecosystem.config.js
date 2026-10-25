const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    // Continue if env loading fails
  }
}

module.exports = {
  apps: [
    {
      name: 'smart-attendance-backend',
      cwd: '/home/jarvis/SharedDrive/bytemap/attandace/backend',
      script: '/home/jarvis/SharedDrive/bytemap/attandace/backend/venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8011 --workers 1',
      interpreter: 'none',
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      env: {
        PYTHONPATH: '.',
        PORT: '8011',
        ENV_FILE: '/home/jarvis/SharedDrive/bytemap/attandace/.env',
      },
    },
    {
      name: 'smart-attendance-frontend',
      cwd: '/home/jarvis/SharedDrive/bytemap/attandace/frontend',
      script: 'server.js',
      interpreter: 'node',
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3011',
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
