const rateLimit = require('express-rate-limit');

class PublicRateLimiterMiddleware {
  constructor() {
    this.limiter = rateLimit({
      windowMs: (process.env.PUBLIC_RATE_LIMIT_WINDOW || 1) * 60 * 1000,
      max: process.env.PUBLIC_RATE_LIMIT_MAX || 10, // tighter than the global default: /public is anonymous, so writes are capped per-IP more aggressively
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        },
      },
    });
  }

  methodBasedLimiter = (req, res, next) => {
    const methodsToLimit = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (methodsToLimit.includes(req.method)) {
      return this.limiter(req, res, next);
    }
    next(); // Skip rate limit for other methods (like GET)
  };
}

module.exports = PublicRateLimiterMiddleware;
