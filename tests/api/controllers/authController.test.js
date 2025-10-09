const AuthController = require('@src/api/controllers/authController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('AuthController', () => {
  let authController;
  let userService;
  let redisClient;
  let businessException;
  let authUtils;
  let logger; // Mock logger

  beforeEach(() => {
    userService = {
      userDetailByUsername: jest.fn(),
    };
    redisClient = {
      set: jest.fn(),
      del: jest.fn(),
      status: jest.fn().mockReturnValue(true), // Add mock for status
    };
    businessException = {
      Unauthorized: jest.fn((message) => new BusinessError({ message, statusCode: 401 })),
    };
    authUtils = {
      comparePassword: jest.fn(),
      generateToken: jest.fn(),
    };
    logger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    authController = new AuthController({
      userService,
      redisClient,
      businessException,
      authUtils,
      logger,
    });
  });

  describe('login', () => {
    const mockReq = {
      body: {
        userName: 'testuser',
        password: 'password123',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return token and userDetail on successful login', async () => {
      const mockUser = {
        id: 'user123',
        userName: 'testuser',
        password: 'hashedpassword',
        isActive: true,
        fullName: 'Test User',
        role: 'USER',
        assigneeOrganization: [
          {
            organizationId: 'org123',
            organization: { name: 'Org Name', FullName: 'Full Org Name' },
          },
        ],
      };
      userService.userDetailByUsername.mockResolvedValue(mockUser);
      authUtils.comparePassword.mockResolvedValue(true);
      authUtils.generateToken.mockReturnValue('mockToken');
      redisClient.set.mockResolvedValue('OK');

      await authController.login(mockReq, mockRes, mockNext);

      expect(userService.userDetailByUsername).toHaveBeenCalledWith('testuser');
      expect(authUtils.comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(authUtils.generateToken).toHaveBeenCalledWith({ userId: 'user123' });
      expect(redisClient.set).toHaveBeenCalledWith(
        'auth:token:mockToken',
        JSON.stringify({
          id: 'user123',
          userName: 'testuser',
          fullName: 'Test User',
          role: 'USER',
          isActive: true,
          organization: {
            organizationId: 'org123',
            name: 'Org Name',
            fullName: 'Full Org Name',
          },
        }),
        'EX',
        3600
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userDetail: {
            id: 'user123',
            userName: 'testuser',
            fullName: 'Test User',
            role: 'USER',
            isActive: true,
            organization: {
              organizationId: 'org123',
              name: 'Org Name',
              fullName: 'Full Org Name',
            },
          },
          token: 'mockToken',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw Unauthorized error for invalid username', async () => {
      userService.userDetailByUsername.mockResolvedValue(null);

      await authController.login(mockReq, mockRes, mockNext);

      expect(userService.userDetailByUsername).toHaveBeenCalledWith('testuser');
      expect(businessException.Unauthorized).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should throw Unauthorized error for inactive user', async () => {
      const mockUser = {
        id: 'user123',
        userName: 'testuser',
        password: 'hashedpassword',
        isActive: false,
      };
      userService.userDetailByUsername.mockResolvedValue(mockUser);

      await authController.login(mockReq, mockRes, mockNext);

      expect(userService.userDetailByUsername).toHaveBeenCalledWith('testuser');
      expect(businessException.Unauthorized).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should throw Unauthorized error for invalid password', async () => {
      const mockUser = {
        id: 'user123',
        userName: 'testuser',
        password: 'hashedpassword',
        isActive: true,
      };
      userService.userDetailByUsername.mockResolvedValue(mockUser);
      authUtils.comparePassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(userService.userDetailByUsername).toHaveBeenCalledWith('testuser');
      expect(authUtils.comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(businessException.Unauthorized).toHaveBeenCalledWith('Invalid credentials');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('Something went wrong');
      userService.userDetailByUsername.mockRejectedValue(mockError);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('logout', () => {
    const mockReq = {
      token: 'mockToken',
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should delete token from redis and return success message', async () => {
      redisClient.del.mockResolvedValue(1);

      await authController.logout(mockReq, mockRes, mockNext);

      expect(redisClient.del).toHaveBeenCalledWith('auth:token:mockToken');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'logout success' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return success even if token is not provided', async () => {
      const reqWithoutToken = { token: undefined };
      await authController.logout(reqWithoutToken, mockRes, mockNext);

      expect(redisClient.del).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'logout success' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('Redis error');
      redisClient.del.mockRejectedValue(mockError);

      await authController.logout(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
