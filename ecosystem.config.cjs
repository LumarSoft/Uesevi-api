module.exports = {
  apps: [
    {
      name: "uesevi_api",
      script: "./app.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M", // Reducido para prevenir problemas de memoria
      min_uptime: "10s", // Tiempo mínimo antes de considerar la app estable
      max_restarts: 10, // Máximo 10 reinicios antes de parar
      restart_delay: 4000, // Esperar 4 segundos entre reinicios
      kill_timeout: 5000, // Dar 5 segundos para cerrar limpiamente
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
      time: true,
      merge_logs: true,
    },
  ],
};
