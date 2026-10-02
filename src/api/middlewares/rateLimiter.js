const rateLimit = require('express-rate-limit');

class RateLimiterMiddleware {
  constructor({ logger } = {}) {
    this.logger = logger;
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
      // Same response as express-rate-limit's default handler, plus a log line so blocked
      // requests are visible.
      handler: (req, res, next, options) => {
        this.logger?.warn('Rate limit exceeded', {
          context: 'RateLimiter',
          limiter: 'global',
          method: req.method,
          path: req.originalUrl.split('?')[0],
          ip: req.ip,
        });
        res.status(options.statusCode).send(options.message);
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
