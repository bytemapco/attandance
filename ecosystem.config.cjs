module.exports = {
  apps: [
    {
      name: 'sahaj-backend',
      cwd: '/home/jarvis/SharedDrive/bytemap/attendance/backend',
      script: '/home/jarvis/SharedDrive/bytemap/attendance/backend/venv/bin/uvicorn',
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
  ],
};
