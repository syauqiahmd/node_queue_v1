class ApiKeyAuthMiddleware {
  constructor({ businessException }) {
    this.businessException = businessException;
    this.serviceKeys = new Map(
      (process.env.SERVICE_API_KEYS || '')
        .split(',')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
          const [name, ...keyParts] = pair.split(':');
          return [keyParts.join(':'), name];
        })
    );
  }

  authenticateService = (req, res, next) => {
    const key = req.headers['x-service-key'];
    const serviceName = key && this.serviceKeys.get(key);

    if (!serviceName) {
      return next(this.businessException.Unauthorized('Invalid service key'));
    }

    req.service = { name: serviceName };
    next();
  };
}

module.exports = ApiKeyAuthMiddleware;
