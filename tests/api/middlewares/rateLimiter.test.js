const RateLimiterMiddleware = require('../../../src/api/middlewares/rateLimiter');
const rateLimit = require('express-rate-limit');

jest.mock('express-rate-limit');

describe('RateLimiterMiddleware', () => {
  let rateLimiterMiddleware;
  let mockLimiter;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockLimiter = jest.fn((req, res, next) => next());
    rateLimit.mockReturnValue(mockLimiter);

    mockReq = {
      method: 'GET',
    };
    mockRes = {};
    mockNext = jest.fn();

    rateLimiterMiddleware = new RateLimiterMiddleware();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize rate limiter with default values', () => {
      expect(rateLimit).toHaveBeenCalledWith(expect.objectContaining({
        windowMs: expect.any(Number),
        max: expect.any(Number),
        legacyHeaders: false,
        message: expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'TOO_MANY_REQUESTS',
          }),
        }),
      }));
    });
  });

  describe('methodBasedLimiter', () => {
    it('should apply limiter for POST method', () => {
      mockReq.method = 'POST';
      rateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should apply limiter for PUT method', () => {
      mockReq.method = 'PUT';
      rateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should apply limiter for PATCH method', () => {
      mockReq.method = 'PATCH';
      rateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should apply limiter for DELETE method', () => {
      mockReq.method = 'DELETE';
      rateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should skip limiter for GET method', () => {
      mockReq.method = 'GET';
      rateLimiterMiddleware.methodBasedLimiter(mockReq, mockRes, mockNext);
      expect(mockLimiter).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
