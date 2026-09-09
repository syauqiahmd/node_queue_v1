class OriginCheckMiddleware {
  constructor({ businessException }) {
    this.businessException = businessException;
    this.allowedOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  isLocalOrigin(origin) {
    return (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://localhost')
    );
  }

  isAllowedOrigin(origin) {
    if (!origin) {
      return false;
    }
    return this.isLocalOrigin(origin) || this.allowedOrigins.includes(origin);
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
