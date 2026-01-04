const AuthMiddleware = require('../../../src/api/middlewares/auth');

describe('AuthMiddleware', () => {
  let authMiddleware;
  let mockRedisClient;
  let mockBusinessException;
  let mockAuthUtils;
  let mockAsyncContext;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
    };

    mockBusinessException = {
      Unauthorized: jest.fn((msg) => new Error(`Unauthorized: ${msg}`)),
      ExpiredSession: jest.fn(() => new Error('Expired session')),
      Forbidden: jest.fn((msg) => new Error(`Forbidden: ${msg}`)),
    };

    mockAuthUtils = {
      verifyToken: jest.fn(),
    };

    mockAsyncContext = {
      setUser: jest.fn(),
    };

    mockReq = {
      headers: {},
    };

    mockRes = {};

    mockNext = jest.fn();

    authMiddleware = new AuthMiddleware({
      redisClient: mockRedisClient,
      businessException: mockBusinessException,
      authUtils: mockAuthUtils,
      asyncContext: mockAsyncContext,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      const decoded = { userId: 1 };
      const cachedUser = JSON.stringify({ id: 1, role: 'USER' });

      mockAuthUtils.verifyToken.mockReturnValue(decoded);
      mockRedisClient.get.mockResolvedValue(cachedUser);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockAuthUtils.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRedisClient.get).toHaveBeenCalledWith('auth:token:valid-token');
      expect(mockReq.user).toEqual({ id: 1, role: 'USER' });
      expect(mockAsyncContext.setUser).toHaveBeenCalledWith({ id: 1, role: 'USER' });
      expect(mockReq.token).toBe('valid-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw Unauthorized if no token provided', async () => {
      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('No token provided');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw ExpiredSession if token not in redis', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      mockAuthUtils.verifyToken.mockReturnValue({ userId: 1 });
      mockRedisClient.get.mockResolvedValue(null);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockBusinessException.ExpiredSession).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle TokenExpiredError', async () => {
      mockReq.headers.authorization = 'Bearer expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw error;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockBusinessException.ExpiredSession).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle JsonWebTokenError', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      mockAuthUtils.verifyToken.mockImplementation(() => {
        throw error;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('Invalid token');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('authorize', () => {
    it('should authorize if user has required role', () => {
      mockReq.user = { role: 'ADMIN' };
      const middleware = authMiddleware.authorize(['ADMIN']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should authorize if user has one of required roles', () => {
      mockReq.user = { role: 'USER' };
      const middleware = authMiddleware.authorize(['ADMIN', 'USER']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw Unauthorized if user role missing', () => {
      mockReq.user = {};
      const middleware = authMiddleware.authorize(['ADMIN']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('User role not found');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw Forbidden if user has insufficient permissions', () => {
      mockReq.user = { role: 'USER' };
      const middleware = authMiddleware.authorize(['ADMIN']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Forbidden).toHaveBeenCalledWith('Insufficient permissions');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use default roles if none provided', () => {
      mockReq.user = { role: 'USER' };
      const middleware = authMiddleware.authorize();

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle array of roles', () => {
      mockReq.user = { role: ['USER', 'MANAGER'] };
      const middleware = authMiddleware.authorize(['MANAGER']);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
