module.exports = {
  apps: [
    {
      name: "api-server",
      script: "dist/src/main.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
        PATH: process.env.HOME + "/.pyenv/shims:" + process.env.PATH,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        PATH: process.env.HOME + "/.pyenv/shims:" + process.env.PATH,
      },
      out_file: "./logs/combined.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
};

