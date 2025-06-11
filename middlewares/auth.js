const redisClient = require('../configs/redisClient');
const businessException = require('../utils/businessException');
const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw businessException.Unauthorized();
    }

    const token = authHeader.split(' ')[1];
    const verifyTokenStatus = verifyToken(token);
    const cachedUser = await redisClient.get(`auth:token:${token}`);
    if (!cachedUser || !verifyTokenStatus) {
      throw businessException.ExpiredSession();
    }
    req.user = JSON.parse(cachedUser);
    req.token = token;
    next();
  } catch (err) {
    logger.error('[AUTH] Failed to authenticate', { context: 'Auth Service', err });
    return errorResponse(res, {
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  }
};

module.exports = authenticateToken;
