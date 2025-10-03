class AuthMiddleware {
  constructor({ redisClient, businessException, authUtils }) {
    this.redisClient = redisClient;
    this.businessException = businessException;
    this.authUtils = authUtils;
  }

  authenticateToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw this.businessException.Unauthorized('No token provided');
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.authUtils.verifyToken(token);

      const cachedUser = await this.redisClient.get(`auth:token:${token}`);
      if (!cachedUser) {
        throw this.businessException.ExpiredSession();
      }

      req.user = JSON.parse(cachedUser);
      req.user.id = decoded.id; // Ensure user id from token is used
      req.token = token;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(this.businessException.ExpiredSession());
      }
      if (err.name === 'JsonWebTokenError') {
        return next(this.businessException.Unauthorized('Invalid token'));
      }
      next(err);
    }
  };
}

module.exports = AuthMiddleware;
