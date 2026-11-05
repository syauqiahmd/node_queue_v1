const { AsyncResource } = require('async_hooks');

const HEALTH_PATH = '/api/v1/health';

class AccessLogMiddleware {
  constructor({ logger }) {
    this.logger = logger;
  }

  // Logs one line per request once the response is sent (or the client disconnects).
  // Listeners are bound to the request's async context so transactionId/user are attached.
  accessLog = (req, res, next) => {
    const start = process.hrtime.bigint();
    let logged = false;

    // Express resets req.baseUrl when an error leaves a nested router, so by the time the
    // response finishes `${req.baseUrl}${req.route.path}` can lose its prefix. Capture the
    // full route pattern at the moment the router assigns req.route instead.
    let matchedRoute;
    Object.defineProperty(req, 'route', {
      configurable: true,
      enumerable: true,
      get: () => matchedRoute?.route,
      set: (route) => {
        matchedRoute = { route, pattern: `${req.baseUrl}${route.path}` };
      },
    });

    const log = AsyncResource.bind((aborted) => {
      if (logged) {
        return;
      }
      logged = true;

      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const path = req.originalUrl.split('?')[0];
      // Route pattern (e.g. /api/v1/queues/:id) groups requests regardless of IDs in the URL.
      const route = matchedRoute?.pattern;
      const meta = {
        context: 'HTTP',
        method: req.method,
        path,
        route,
        statusCode: aborted ? undefined : res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
        contentLength: res.getHeader('content-length'),
        aborted: aborted || undefined,
      };

      const status = aborted ? 'ABORTED' : res.statusCode;
      const message = `${req.method} ${route || path} ${status} ${meta.durationMs}ms`;
      // Uptime monitors hit /health every minute; keep those out of the info log.
      if (path === HEALTH_PATH) {
        this.logger.debug(message, meta);
        return;
      }
      this.logger.info(message, meta);
    });

    res.on('finish', () => log(false));
    res.on('close', () => log(!res.writableFinished));
    next();
  };
}

module.exports = AccessLogMiddleware;
