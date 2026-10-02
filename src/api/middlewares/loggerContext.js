class LoggerContextMiddleware {
  constructor({ asyncContext }) {
    this.asyncLocalStorage = asyncContext.asyncLocalStorage;
  }

  loggerContext = (req, res, next) => {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      const requestContext = {
        // Query strings can carry search filters with personal data (e.g. ?phoneNumber=...),
        // and this context is attached to every log line, so only the path is kept.
        path: req.originalUrl.split('?')[0],
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };
      store.set('requestContext', requestContext);
    }
    next();
  };
}

module.exports = LoggerContextMiddleware;
