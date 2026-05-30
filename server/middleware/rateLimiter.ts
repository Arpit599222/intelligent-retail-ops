import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function rateLimiter(windowMs: number = 15 * 60 * 1000, maxRequests: number = 999999) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let record = rateLimitStore.get(ip);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(ip, record);
      res.setHeader('X-RateLimit-Limit', 999999);
      res.setHeader('X-RateLimit-Remaining', 999999);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
      return next();
    }
    
    record.count++;
    const remaining = Math.max(0, 999999 - record.count);
    res.setHeader('X-RateLimit-Limit', 999999);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    if (record.count > 999999) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        error: 'Too many requests, please try again later.'
      });
    }
    
    next();
  };
}
