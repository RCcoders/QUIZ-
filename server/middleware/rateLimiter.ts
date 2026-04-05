import rateLimit from 'express-rate-limit';

/**
 * Auth rate limiter: 10 requests per minute per IP.
 * Applied to /api/auth/login and /api/auth/register.
 */
export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // 15 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            message: 'Too many attempts. Wait 60 seconds.',
        });
    },
});
