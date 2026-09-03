import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { traceId } from './middleware/traceId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.router.js';
import { masterRouter } from './modules/master/master.router.js';
import { inventoryRouter } from './modules/inventory/inventory.router.js';
import { transactionRouter } from './modules/transaction/transaction.router.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { accountingRouter } from './modules/accounting/accounting.routes.js';
import { complianceRouter } from './modules/compliance/compliance.routes.js';
import { operationsRouter } from './modules/operations/operations.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { hrRouter } from './modules/hr/hr.routes.js';
import { crmRouter } from './modules/crm/routes/crm.routes.js';
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

  // Health, liveness, and readiness probes
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/readyz', (_req, res) => {
    const isDbReady = mongoose.connection.readyState === 1;
    if (isDbReady) {
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Mount API modules (with rate limiting on authentication routes)
  app.use('/api/v1/auth', rateLimiter(15 * 60 * 1000, 50), authRouter);
  app.use('/api/v1', masterRouter);
  app.use('/api/v1/organizations/:orgId', inventoryRouter);
  app.use('/api/v1/organizations/:orgId', transactionRouter);
  app.use('/api/v1/organizations/:orgId', reportsRouter);
  app.use('/api/v1/organizations/:orgId', accountingRouter);
  app.use('/api/v1/organizations/:orgId', complianceRouter);
  app.use('/api/v1/organizations/:orgId', operationsRouter);
  app.use('/api/v1/organizations/:orgId', notificationRouter);
  app.use('/api/v1/organizations/:orgId', hrRouter);
  app.use('/api/v1/organizations/:orgId', crmRouter);

  // Catch-all 404 for undefined routes
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
