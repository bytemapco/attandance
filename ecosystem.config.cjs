module.exports = {
  apps: [
    {
      name: 'smart-attendance-backend',
      cwd: '/home/jarvis/SharedDrive/bytemap/attandace/backend',
      script: '/home/jarvis/SharedDrive/bytemap/attandace/backend/venv/bin/uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8011 --workers 1',
      interpreter: 'none',
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      env: {
        PYTHONPATH: '.',
        PORT: '8011',
      },
    },
    {
      name: 'smart-attendance-frontend',
      cwd: '/home/jarvis/SharedDrive/bytemap/attandace/frontend',
      script: 'server.js',
      interpreter: 'node',
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3011',
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
