const UserController = require('@src/api/controllers/userController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('UserController', () => {
  let userController;
  let userService;
  let businessException;

  beforeEach(() => {
    userService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn((item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })),
    };

    userController = new UserController({
      userService,
      businessException,
    });
  });

  describe('getAll', () => {
    const mockReq = {
      query: { page: 1, pageSize: 10, role: 'ADMIN' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return all users with pagination and filters', async () => {
      const mockUsers = [
        { id: 'user1', userName: 'user1' },
        { id: 'user2', userName: 'user2' },
      ];
      userService.getAll.mockResolvedValue({ totalRecord: 2, data: mockUsers });

      await userController.getAll(mockReq, mockRes, mockNext);

      expect(userService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        role: 'ADMIN',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { totalRecord: 2, data: mockUsers },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      userService.getAll.mockRejectedValue(mockError);

      await userController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getById', () => {
    const mockReq = {
      params: { userId: 'user123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return a user by ID', async () => {
      const mockUser = { id: 'user123', userName: 'user123' };
      userService.getById.mockResolvedValue(mockUser);

      await userController.getById(mockReq, mockRes, mockNext);

      expect(userService.getById).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockUser });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if user does not exist', async () => {
      userService.getById.mockResolvedValue(null);

      await userController.getById(mockReq, mockRes, mockNext);

      expect(userService.getById).toHaveBeenCalledWith('user123');
      expect(businessException.NotFound).toHaveBeenCalledWith('User');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      userService.getById.mockRejectedValue(mockError);

      await userController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    const mockReq = {
      body: { userName: 'newUser', fullName: 'New User', password: 'password', role: 'USER', organizationId: 'org123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should create a new user', async () => {
      const newUser = { id: 'newUserId', userName: 'newUser' };
      userService.create.mockResolvedValue(newUser);

      await userController.create(mockReq, mockRes, mockNext);

      expect(userService.create).toHaveBeenCalledWith({
        user: {
          userName: 'newUser',
          fullName: 'New User',
          password: 'password',
          role: 'USER',
        },
        organization: {
          id: 'org123',
        },
        createdBy: 'admin',
        updatedBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: newUser, message: 'Created' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      userService.create.mockRejectedValue(mockError);

      await userController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('update', () => {
    const mockReq = {
      params: { userId: 'user123' },
      body: { userName: 'updatedUser' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should update an existing user', async () => {
      const updatedUser = { id: 'user123', userName: 'updatedUser' };
      userService.update.mockResolvedValue(updatedUser);

      await userController.update(mockReq, mockRes, mockNext);

      expect(userService.update).toHaveBeenCalledWith('user123', { userName: 'updatedUser' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedUser, message: 'Updated' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      userService.update.mockRejectedValue(mockError);

      await userController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('remove', () => {
    const mockReq = {
      params: { userId: 'user123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should remove a user', async () => {
      const removedUser = { id: 'user123', userName: 'removedUser' };
      userService.remove.mockResolvedValue(removedUser);

      await userController.remove(mockReq, mockRes, mockNext);

      expect(userService.remove).toHaveBeenCalledWith('user123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: removedUser, message: 'Deleted' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      userService.remove.mockRejectedValue(mockError);

      await userController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
