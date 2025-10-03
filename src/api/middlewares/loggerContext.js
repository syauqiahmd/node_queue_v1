class LoggerContextMiddleware {
  constructor({ asyncContext }) {
    this.asyncLocalStorage = asyncContext.asyncLocalStorage;
  }

  loggerContext = (req, res, next) => {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      const requestContext = {
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
      };
      store.set('requestContext', requestContext);
    }
    next();
  };
}

module.exports = LoggerContextMiddleware;
