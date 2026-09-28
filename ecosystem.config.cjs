/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: "m2m-admin",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 5507",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "768M",
      time: true,
      merge_logs: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
