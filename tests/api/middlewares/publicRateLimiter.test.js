const PublicRateLimiterMiddleware = require('../../../src/api/middlewares/publicRateLimiter');
const rateLimit = require('express-rate-limit');

jest.mock('express-rate-limit');

describe('PublicRateLimiterMiddleware', () => {
  let publicRateLimiterMiddleware;
  let mockLimiter;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockLimiter = jest.fn((req, res, next) => next());
    rateLimit.mockReturnValue(mockLimiter);

    mockReq = { method: 'GET' };
    mockRes = {};
    mockNext = jest.fn();

    publicRateLimiterMiddleware = new PublicRateLimiterMiddleware();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize rate limiter with values from env or defaults', () => {
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          legacyHeaders: false,
          message: expect.objectContaining({
            success: false,
            error: expect.objectContaining({ code: 'TOO_MANY_REQUESTS' }),
          }),
        })
      );
    });
  });

  describe('methodBasedLimiter', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('should apply limiter for %s method', (method) => {
      mockReq.method = method;
      publicRateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should skip limiter for GET method', () => {
      mockReq.method = 'GET';
      publicRateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
