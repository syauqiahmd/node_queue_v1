const ServiceServiceProxy = require('../../../src/core/services/ServiceServiceProxy');

describe('ServiceServiceProxy', () => {
  let serviceServiceProxy;
  let mockServiceServiceReal;
  let mockCacheService;
  let mockLogger;

  beforeEach(() => {
    mockServiceServiceReal = {
      getAll: jest.fn(),
      publicGetAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

    serviceServiceProxy = new ServiceServiceProxy({
      serviceServiceReal: mockServiceServiceReal,
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
      const cachedData = JSON.stringify([{ id: 1, name: 'S1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await serviceServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockServiceServiceReal.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { page: 1 };
      const realData = [{ id: 1, name: 'S1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockServiceServiceReal.getAll.mockResolvedValue(realData);

      const result = await serviceServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockServiceServiceReal.getAll).toHaveBeenCalledWith(payload, true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('service:all:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });

    it('should not set cache if real service returns null', async () => {
      const id = 'service-1';
      mockCacheService.get.mockResolvedValue(null);
      mockServiceServiceReal.getById.mockResolvedValue(null);

      const result = await serviceServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockServiceServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('publicGetAll', () => {
    it('should return cached data if available', async () => {
      const payload = { page: 1 };
      const cachedData = JSON.stringify([{ id: 1, name: 'S1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await serviceServiceProxy.publicGetAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockServiceServiceReal.publicGetAll).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { page: 1 };
      const realData = [{ id: 1, name: 'S1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockServiceServiceReal.publicGetAll.mockResolvedValue(realData);

      const result = await serviceServiceProxy.publicGetAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockServiceServiceReal.publicGetAll).toHaveBeenCalledWith(payload, true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('service:allPublic:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('getById', () => {
    it('should return cached data if available', async () => {
      const id = 'service-1';
      const cachedData = JSON.stringify({ id, name: 'S1' });
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await serviceServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockServiceServiceReal.getById).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const id = 'service-1';
      const realData = { id, name: 'S1' };
      mockCacheService.get.mockResolvedValue(null);
      mockServiceServiceReal.getById.mockResolvedValue(realData);

      const result = await serviceServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockServiceServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(`service:id:${id}`),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('create', () => {
    it('should call real service and invalidate cache', async () => {
      const data = { name: 'S1' };
      const createdData = { id: 1, ...data };
      mockServiceServiceReal.create.mockResolvedValue(createdData);

      const result = await serviceServiceProxy.create(data);

      expect(mockServiceServiceReal.create).toHaveBeenCalledWith(data);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('service:');
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(createdData);
    });
  });

  describe('update', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'service-1';
      const data = { name: 'S2' };
      const updatedData = { id, ...data };
      mockServiceServiceReal.update.mockResolvedValue(updatedData);

      const result = await serviceServiceProxy.update(id, data);

      expect(mockServiceServiceReal.update).toHaveBeenCalledWith(id, data);
      expect(mockCacheService.del).toHaveBeenCalledWith(`service:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('service:');
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(updatedData);
    });
  });

  describe('remove', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'service-1';
      const deletedData = { id, name: 'S1' };
      mockServiceServiceReal.remove.mockResolvedValue(deletedData);

      const result = await serviceServiceProxy.remove(id);

      expect(mockServiceServiceReal.remove).toHaveBeenCalledWith(id);
      expect(mockCacheService.del).toHaveBeenCalledWith(`service:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('service:');
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(deletedData);
    });
  });
});
