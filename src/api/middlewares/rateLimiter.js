const rateLimit = require('express-rate-limit');

class RateLimiterMiddleware {
  constructor() {
    this.limiter = rateLimit({
      windowMs: (process.env.RATE_LIMIT_WINDOW || 1) * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 1, // per IP
      // standardHeaders: false,
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

module.exports = RateLimiterMiddleware;
