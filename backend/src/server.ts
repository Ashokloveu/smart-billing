import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Smart Billing ERP Backend listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ error }, 'Fatal error during server startup');
    process.exit(1);
  }
};

startServer();
