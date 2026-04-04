import { Request, Response, NextFunction } from 'express';

const accessMap = new Map<string, number[]>();

export const aiRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as any).user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = 60000;
  const limit = 5;

  const timestamps = accessMap.get(userId) || [];
  
  // Clean up old timestamps
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    res.status(429).json({ message: 'Rate limit exceeded. Maximum 5 AI requests per minute.' });
    return;
  }

  validTimestamps.push(now);
  accessMap.set(userId, validTimestamps);
  
  next();
};

export const clearRateLimiterCache = () => accessMap.clear();
