const UserController = require('../../../src/api/controllers/userController');

describe('UserController', () => {
  let userController;
  let mockUserService;
  let mockBusinessException;
  let mockAuthUtils;
  let mockIdentityHelper;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockUserService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockBusinessException = {
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockAuthUtils = {
      hashPassword: jest.fn((pass) => `hashed-${pass}`),
    };

    mockIdentityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue(1),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    userController = new UserController({
      userService: mockUserService,
      businessException: mockBusinessException,
      authUtils: mockAuthUtils,
      identityHelper: mockIdentityHelper,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of users', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const data = [{ id: 1, userName: 'user1' }];
      mockUserService.getAll.mockResolvedValue(data);

      await userController.getAll(mockReq, mockRes, mockNext);

      expect(mockUserService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      mockReq.params.userId = 'user-1';
      const data = { id: 'user-1', userName: 'user1' };
      mockUserService.getById.mockResolvedValue(data);

      await userController.getById(mockReq, mockRes, mockNext);

      expect(mockUserService.getById).toHaveBeenCalledWith('user-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should throw NotFound if user not found', async () => {
      mockReq.params.userId = 'user-1';
      mockUserService.getById.mockResolvedValue(null);

      await userController.getById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('User');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      mockReq.body = {
        userName: 'user1',
        fullName: 'User One',
        password: 'password',
        role: 'USER',
        organizationId: 'org-1',
      };
      const data = { id: 1, userName: 'user1' };
      mockUserService.create.mockResolvedValue(data);

      await userController.create(mockReq, mockRes, mockNext);

      expect(mockAuthUtils.hashPassword).toHaveBeenCalledWith('password');
      expect(mockUserService.create).toHaveBeenCalledWith({
        user: {
          userName: 'user1',
          fullName: 'User One',
          password: 'hashed-password',
          role: 'USER',
        },
        organization: {
          id: 'org-1',
        },
        createdBy: 1,
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });
  });

  describe('update', () => {
    it('should update user with password', async () => {
      mockReq.params.userId = 'user-1';
      mockReq.body = {
        fullName: 'User Two',
        password: 'new-password',
      };
      const data = { id: 'user-1', fullName: 'User Two' };
      mockUserService.update.mockResolvedValue(data);

      await userController.update(mockReq, mockRes, mockNext);

      expect(mockAuthUtils.hashPassword).toHaveBeenCalledWith('new-password');
      expect(mockUserService.update).toHaveBeenCalledWith('user-1', {
        fullName: 'User Two',
        password: 'hashed-new-password',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });

    it('should update user without password', async () => {
      mockReq.params.userId = 'user-1';
      mockReq.body = {
        fullName: 'User Two',
      };
      const data = { id: 'user-1', fullName: 'User Two' };
      mockUserService.update.mockResolvedValue(data);

      await userController.update(mockReq, mockRes, mockNext);

      expect(mockAuthUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockUserService.update).toHaveBeenCalledWith('user-1', {
        fullName: 'User Two',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      mockReq.params.userId = 'user-1';
      const data = { id: 'user-1' };
      mockUserService.remove.mockResolvedValue(data);

      await userController.remove(mockReq, mockRes, mockNext);

      expect(mockUserService.remove).toHaveBeenCalledWith('user-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Deleted' });
    });
  });
});
