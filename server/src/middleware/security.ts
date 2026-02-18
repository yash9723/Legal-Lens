import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// 1. HTTPS Enforcement
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
    // Check if running in production or if specifically enabled
    // We assume standard headers from proxies (Heroku, AWS, Nginx)
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (process.env.NODE_ENV === 'production' && !isSecure) {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
};

// 2. Strict Origin/Referer Check for API
export const validateOrigin = (allowedOrigins: string[]) => (req: Request, res: Response, next: NextFunction) => {
    // Skip for non-API routes if needed, or Apply globally
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Allow tools like Postman if strictly verifying in dev, but for production:
    if (!origin && !referer) {
        // Block requests with no origin/referer in production if strictly enforcing
        // For now, we might allow them to support mobile apps that might not send it, 
        // OR we enforce it if we are sure mobile sends it. 
        // Let's be lenient for "unknown" but strict for "mismatched"
        return next();
    }

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ message: 'Origin not allowed' });
    }

    // If referer exists, check if it starts with one of the allowed origins
    if (referer) {
        const isValidReferer = allowedOrigins.some(allowed => referer.startsWith(allowed));
        if (!isValidReferer) {
            return res.status(403).json({ message: 'Referer not allowed' });
        }
    }

    next();
};

// 3. Rate Limiters
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Strict limit for auth endpoints (5-10 tries)
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again after 15 minutes.' }
});
