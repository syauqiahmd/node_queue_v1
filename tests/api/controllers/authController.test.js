const AuthController = require('../../../src/api/controllers/authController');

describe('AuthController', () => {
  let authController;
  let mockUserService;
  let mockRedisClient;
  let mockBusinessException;
  let mockAuthUtils;
  let mockLogger;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockUserService = {
      userDetailByUsername: jest.fn(),
    };
    mockRedisClient = {
      status: jest.fn().mockReturnValue('ready'),
      set: jest.fn(),
      del: jest.fn(),
    };
    mockBusinessException = {
      Unauthorized: jest.fn((msg) => new Error(msg)),
    };
    mockAuthUtils = {
      comparePassword: jest.fn(),
      generateToken: jest.fn(),
      decodeToken: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
    };

    mockReq = {
      body: {},
      token: 'some-token',
      user: { id: 1 },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    authController = new AuthController({
      userService: mockUserService,
      redisClient: mockRedisClient,
      businessException: mockBusinessException,
      authUtils: mockAuthUtils,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and return token', async () => {
      mockReq.body = { userName: 'user1', password: 'password' };
      const user = {
        id: 1,
        userName: 'user1',
        fullName: 'User One',
        role: 'USER',
        isActive: true,
        password: 'hashed-password',
        assigneeOrganization: [{ organization: { name: 'Org 1', FullName: 'Organization 1' }, organizationId: 'org-1' }],
      };
      mockUserService.userDetailByUsername.mockResolvedValue(user);
      mockAuthUtils.comparePassword.mockResolvedValue(true);
      mockAuthUtils.generateToken.mockReturnValue('new-token');

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockUserService.userDetailByUsername).toHaveBeenCalledWith('user1');
      expect(mockAuthUtils.comparePassword).toHaveBeenCalledWith('password', 'hashed-password');
      expect(mockAuthUtils.generateToken).toHaveBeenCalledWith({ userId: 1 });
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'auth:token:new-token',
        expect.any(String),
        'EX',
        3600
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'new-token' })
      }));
    });

    it('should throw Unauthorized if user not found or inactive', async () => {
      mockReq.body = { userName: 'user1', password: 'password' };
      mockUserService.userDetailByUsername.mockResolvedValue(null);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw Unauthorized if password does not match', async () => {
      mockReq.body = { userName: 'user1', password: 'password' };
      const user = { id: 1, isActive: true, password: 'hashed-password' };
      mockUserService.userDetailByUsername.mockResolvedValue(user);
      mockAuthUtils.comparePassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Unauthorized).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('logout', () => {
    it('should delete token from redis and return success', async () => {
      mockReq.token = 'some-token';

      await authController.logout(mockReq, mockRes, mockNext);

      expect(mockRedisClient.del).toHaveBeenCalledWith('auth:token:some-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { message: 'logout success' } });
    });
  });

  describe('validateToken', () => {
    it('should return valid token info', async () => {
      mockReq.token = 'some-token';
      mockReq.user = { id: 1 };
      mockAuthUtils.decodeToken.mockReturnValue({ exp: 1234567890 });

      await authController.validateToken(mockReq, mockRes, mockNext);

      expect(mockAuthUtils.decodeToken).toHaveBeenCalledWith('some-token');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ expiresAt: expect.any(Date) })
      }));
    });

    it('should handle errors', async () => {
      mockAuthUtils.decodeToken.mockImplementation(() => { throw new Error('Invalid token'); });

      await authController.validateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
