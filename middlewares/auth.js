const { redis: redisClient } = require('../configs/redisClient');
const businessException = require('../utils/businessException');
const { verifyToken } = require('../utils/jwt');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw businessException.Unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const cachedUser = await redisClient.get(`auth:token:${token}`);
    if (!cachedUser) {
      throw businessException.ExpiredSession();
    }

    req.user = JSON.parse(cachedUser);
    req.user.id = decoded.id; // Ensure user id from token is used
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(businessException.ExpiredSession());
    }
    if (err.name === 'JsonWebTokenError') {
      return next(businessException.Unauthorized('Invalid token'));
    }
    next(err);
  }
};

module.exports = authenticateToken;
