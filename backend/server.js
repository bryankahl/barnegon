import "dotenv/config";
import { app } from "./src/app.js";
import { config } from "./src/config.js";
import { logger } from "./src/utils/logger.js";

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info("server_started", { port: PORT });
});

const shutdown = (signal) => {
  logger.info(`${signal}_received`, { message: "Starting graceful shutdown" });
  setTimeout(() => {
    logger.error("shutdown_timeout", { message: "Forcefully terminating process after 10s" });
    process.exit(1);
  }, 10000).unref(); 
  server.close(() => {
    logger.info("server_closed", { message: "All connections drained. Exiting." });
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("sigterm"));
process.on("SIGINT", () => shutdown("sigint"));