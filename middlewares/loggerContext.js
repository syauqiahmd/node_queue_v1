const { asyncLocalStorage } = require('../utils/asyncContext');

const loggerContext = (req, res, next) => {
  const store = asyncLocalStorage.getStore();
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

module.exports = loggerContext;
