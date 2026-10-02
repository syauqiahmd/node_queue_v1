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
      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          legacyHeaders: false,
          message: expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'TOO_MANY_REQUESTS',
            }),
          }),
        })
      );
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

  describe('handler', () => {
    it('logs the blocked request and sends the configured 429 response', () => {
      const mockLogger = { warn: jest.fn() };
      rateLimit.mockClear();
      new RateLimiterMiddleware({ logger: mockLogger });
      const { handler, message } = rateLimit.mock.calls[0][0];
      const req = { method: 'POST', originalUrl: '/api/v1/x?y=1', ip: '1.2.3.4' };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      handler(req, res, jest.fn(), { statusCode: 429, message });

      expect(mockLogger.warn).toHaveBeenCalledWith('Rate limit exceeded', {
        context: 'RateLimiter',
        limiter: 'global',
        method: 'POST',
        path: '/api/v1/x',
        ip: '1.2.3.4',
      });
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        },
      });
    });
  });
});
