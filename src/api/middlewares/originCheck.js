const { isAllowedOrigin } = require('../../infra/utils/allowedOrigins');

class OriginCheckMiddleware {
  constructor({ businessException }) {
    this.businessException = businessException;
  }

  // CORS_ORIGIN, plus localhost only in development (src/infra/utils/allowedOrigins.js).
  isAllowedOrigin(origin) {
    return isAllowedOrigin(origin);
  }

  originFromReferer(referer) {
    if (!referer) {
      return null;
    }
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  // Soft mitigation, not a hard security boundary: Origin/Referer can be forged by
  // any caller that chooses to. This only stops a service that reuses the open
  // /public write endpoints out of convenience instead of going through the
  // authenticated /private routes - it will not stop a deliberate bypass.
  enforceForWrites = (req, res, next) => {
    const methodsToCheck = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!methodsToCheck.includes(req.method)) {
      return next();
    }

    const origin = req.headers.origin || this.originFromReferer(req.headers.referer);

    if (!this.isAllowedOrigin(origin)) {
      return next(this.businessException.Forbidden('Request origin not allowed'));
    }

    next();
  };
}

module.exports = OriginCheckMiddleware;
