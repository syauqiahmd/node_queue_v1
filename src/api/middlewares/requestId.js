const { v4: uuidv4 } = require('uuid');
const asyncContext = require('../../infra/utils/asyncContext');

class RequestIdMiddleware {
  constructor({ asyncContext }) {
    this.asyncLocalStorage = asyncContext.asyncLocalStorage;
  }

  requestIdMiddleware = (req, res, next) => {
    const transactionId = uuidv4();
    req.transactionId = transactionId;
    req.headers['x-transaction-id'] = transactionId;

    // Set transactionId to response header
    res.setHeader('x-transaction-id', transactionId);

    // Patch res.json to include it in every JSON response body
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (typeof body === 'object' && body !== null) {
        body.transactionId = transactionId;
      }
      return originalJson(body);
    };

    // Use asyncLocalStorage for logging scope
    this.asyncLocalStorage.run(new Map([['transactionId', transactionId]]), () => {
      // Set user in async context if available
      if (req.user) {
        asyncContext.setUser(req.user);
      }
      next();
    });
  };
}

module.exports = RequestIdMiddleware;
