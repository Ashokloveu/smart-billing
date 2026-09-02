import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      {
        correlationId,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
      },
      `Operational Error: ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
      correlationId,
      errors: err.errors,
    });
    return;
  }

  // Unhandled Programmer Error or Server Exception
  logger.error(
    {
      correlationId,
      err,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    },
    '🔥 Unhandled Internal Server Exception'
  );

  res.status(500).json({
    success: false,
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
    correlationId,
  });
};
