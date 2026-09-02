import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const traceId = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};
