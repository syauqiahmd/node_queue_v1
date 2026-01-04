const UserServiceProxy = require('../../../src/core/services/UserServiceProxy');

describe('UserServiceProxy', () => {
  let userServiceProxy;
  let mockUserServiceReal;
  let mockCacheService;
  let mockLogger;

  beforeEach(() => {
    mockUserServiceReal = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      userDetailByUsername: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      invalidate: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
    };

    userServiceProxy = new UserServiceProxy({
      userServiceReal: mockUserServiceReal,
      cacheService: mockCacheService,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return cached data if available', async () => {
      const payload = { page: 1 };
      const cachedData = JSON.stringify([{ id: 1, userName: 'user1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await userServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockUserServiceReal.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { page: 1 };
      const realData = [{ id: 1, userName: 'user1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockUserServiceReal.getAll.mockResolvedValue(realData);

      const result = await userServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockUserServiceReal.getAll).toHaveBeenCalledWith(payload);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('user:all:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });

    it('should not set cache if real service returns null', async () => {
      const id = 'user-1';
      mockCacheService.get.mockResolvedValue(null);
      mockUserServiceReal.getById.mockResolvedValue(null);

      const result = await userServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockUserServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return cached data if available', async () => {
      const id = 'user-1';
      const cachedData = JSON.stringify({ id, userName: 'user1' });
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await userServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockUserServiceReal.getById).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const id = 'user-1';
      const realData = { id, userName: 'user1' };
      mockCacheService.get.mockResolvedValue(null);
      mockUserServiceReal.getById.mockResolvedValue(realData);

      const result = await userServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockUserServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(`user:id:${id}`),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('create', () => {
    it('should call real service and invalidate cache', async () => {
      const data = { userName: 'user1' };
      const createdData = { id: 1, ...data };
      mockUserServiceReal.create.mockResolvedValue(createdData);

      const result = await userServiceProxy.create(data);

      expect(mockUserServiceReal.create).toHaveBeenCalledWith(data);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('user:');
      expect(result).toEqual(createdData);
    });
  });

  describe('update', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'user-1';
      const data = { userName: 'user2' };
      const updatedData = { id, ...data };
      mockUserServiceReal.update.mockResolvedValue(updatedData);

      const result = await userServiceProxy.update(id, data);

      expect(mockUserServiceReal.update).toHaveBeenCalledWith(id, data);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('user:');
      expect(result).toEqual(updatedData);
    });
  });

  describe('remove', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'user-1';
      const deletedData = { id, userName: 'user1' };
      mockUserServiceReal.remove.mockResolvedValue(deletedData);

      const result = await userServiceProxy.remove(id);

      expect(mockUserServiceReal.remove).toHaveBeenCalledWith(id);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('user:');
      expect(result).toEqual(deletedData);
    });
  });

  describe('userDetailByUsername', () => {
    it('should call real service directly (no cache implemented yet)', async () => {
      const userName = 'user1';
      const userData = { id: 1, userName };
      mockUserServiceReal.userDetailByUsername.mockResolvedValue(userData);

      const result = await userServiceProxy.userDetailByUsername(userName);

      expect(mockUserServiceReal.userDetailByUsername).toHaveBeenCalledWith(userName);
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(result).toEqual(userData);
    });
  });
});
