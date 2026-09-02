import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale keys every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) {
      store.delete(key);
    }
  }
}, 300000);

/**
 * Creates an in-memory IP rate limiter middleware
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 * @param max Max requests per IP in the window (default: 100)
 */
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = store.get(ip);
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP. Please try again later.',
        },
      });
    }

    next();
  };
};
