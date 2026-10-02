const { v4: uuidv4 } = require('uuid');
const asyncContext = require('../../infra/utils/asyncContext');

// Accept a caller-supplied ID (e.g. from a service-to-service caller) so one request can be
// followed across systems. Restricted to safe characters so it can't inject into logs.
const VALID_TRANSACTION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

class RequestIdMiddleware {
  constructor({ asyncContext }) {
    this.asyncLocalStorage = asyncContext.asyncLocalStorage;
  }

  requestIdMiddleware = (req, res, next) => {
    const incomingId = req.headers['x-transaction-id'];
    const transactionId =
      typeof incomingId === 'string' && VALID_TRANSACTION_ID.test(incomingId)
        ? incomingId
        : uuidv4();
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
