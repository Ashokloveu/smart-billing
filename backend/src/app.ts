import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { traceId } from './middleware/traceId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.router.js';
import { masterRouter } from './modules/master/master.router.js';
import { NotFoundError } from './errors/AppError.js';

export const createApp = (): express.Application => {
  const app = express();

  // Security & Parsing
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Request correlation tracing
  app.use(traceId);

  // Health and liveness endpoints
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API modules
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1', masterRouter);

  // Catch-all 404 for undefined routes
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
