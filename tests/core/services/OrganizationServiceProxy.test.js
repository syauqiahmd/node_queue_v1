const OrganizationServiceProxy = require('../../../src/core/services/OrganizationServiceProxy');

describe('OrganizationServiceProxy', () => {
  let organizationServiceProxy;
  let mockOrganizationServiceReal;
  let mockCacheService;
  let mockLogger;

  beforeEach(() => {
    mockOrganizationServiceReal = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getPublicList: jest.fn(),
      getAllWithService: jest.fn(),
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

    organizationServiceProxy = new OrganizationServiceProxy({
      organizationServiceReal: mockOrganizationServiceReal,
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
      const cachedData = JSON.stringify([{ id: 1, name: 'Org 1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await organizationServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockOrganizationServiceReal.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { page: 1 };
      const realData = [{ id: 1, name: 'Org 1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getAll.mockResolvedValue(realData);

      const result = await organizationServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getAll).toHaveBeenCalledWith(payload);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('organization:all:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });

    it('should not set cache if real service returns null', async () => {
      const id = 'org-1';
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getById.mockResolvedValue(null);

      const result = await organizationServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return cached data if available', async () => {
      const id = 'org-1';
      const cachedData = JSON.stringify({ id, name: 'Org 1' });
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await organizationServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockOrganizationServiceReal.getById).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const id = 'org-1';
      const realData = { id, name: 'Org 1' };
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getById.mockResolvedValue(realData);

      const result = await organizationServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(`organization:id:${id}`),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });

    it('should not set cache if real service returns null', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getPublicList.mockResolvedValue(null);

      const result = await organizationServiceProxy.getPublicList();

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getPublicList).toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getPublicList', () => {
    it('should return cached data if available', async () => {
      const cachedData = JSON.stringify([{ id: 1, name: 'Org 1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await organizationServiceProxy.getPublicList();

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockOrganizationServiceReal.getPublicList).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const realData = [{ id: 1, name: 'Org 1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getPublicList.mockResolvedValue(realData);

      const result = await organizationServiceProxy.getPublicList();

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getPublicList).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('organization:publicList'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('getAllWithService', () => {
    it('should return cached data if available', async () => {
      const payload = { isActive: true };
      const cachedData = JSON.stringify([{ id: 1, name: 'Org 1', services: [] }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await organizationServiceProxy.getAllWithService(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockOrganizationServiceReal.getAllWithService).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { isActive: true };
      const realData = [{ id: 1, name: 'Org 1', services: [] }];
      mockCacheService.get.mockResolvedValue(null);
      mockOrganizationServiceReal.getAllWithService.mockResolvedValue(realData);

      const result = await organizationServiceProxy.getAllWithService(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockOrganizationServiceReal.getAllWithService).toHaveBeenCalledWith(payload);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('organization:allWithService:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('create', () => {
    it('should call real service and invalidate cache', async () => {
      const data = { name: 'Org 1' };
      const createdData = { id: 1, ...data };
      mockOrganizationServiceReal.create.mockResolvedValue(createdData);

      const result = await organizationServiceProxy.create(data);

      expect(mockOrganizationServiceReal.create).toHaveBeenCalledWith(data);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('organization:');
      expect(result).toEqual(createdData);
    });
  });

  describe('update', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'org-1';
      const data = { name: 'Org 2' };
      const updatedData = { id, ...data };
      mockOrganizationServiceReal.update.mockResolvedValue(updatedData);

      const result = await organizationServiceProxy.update(id, data);

      expect(mockOrganizationServiceReal.update).toHaveBeenCalledWith(id, data);
      expect(mockCacheService.del).toHaveBeenCalledWith(`organization:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('organization:');
      expect(result).toEqual(updatedData);
    });
  });

  describe('remove', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'org-1';
      const deletedData = { id, name: 'Org 1' };
      mockOrganizationServiceReal.remove.mockResolvedValue(deletedData);

      const result = await organizationServiceProxy.remove(id);

      expect(mockOrganizationServiceReal.remove).toHaveBeenCalledWith(id);
      expect(mockCacheService.del).toHaveBeenCalledWith(`organization:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('organization:');
      expect(result).toEqual(deletedData);
    });
  });
});
