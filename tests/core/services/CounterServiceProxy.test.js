const CounterServiceProxy = require('../../../src/core/services/CounterServiceProxy');

describe('CounterServiceProxy', () => {
  let counterServiceProxy;
  let mockCounterServiceReal;
  let mockCacheService;
  let mockLogger;

  beforeEach(() => {
    mockCounterServiceReal = {
      getAll: jest.fn(),
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

    counterServiceProxy = new CounterServiceProxy({
      counterServiceReal: mockCounterServiceReal,
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
      const cachedData = JSON.stringify([{ id: 1, counterNumber: 'C1' }]);
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await counterServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockCounterServiceReal.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const payload = { page: 1 };
      const realData = [{ id: 1, counterNumber: 'C1' }];
      mockCacheService.get.mockResolvedValue(null);
      mockCounterServiceReal.getAll.mockResolvedValue(realData);

      const result = await counterServiceProxy.getAll(payload);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockCounterServiceReal.getAll).toHaveBeenCalledWith(payload);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('counter:all:'),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('getById', () => {
    it('should return cached data if available', async () => {
      const id = 'counter-1';
      const cachedData = JSON.stringify({ id, counterNumber: 'C1' });
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await counterServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockCounterServiceReal.getById).not.toHaveBeenCalled();
      expect(result).toEqual(JSON.parse(cachedData));
    });

    it('should fetch from real service if cache miss', async () => {
      const id = 'counter-1';
      const realData = { id, counterNumber: 'C1' };
      mockCacheService.get.mockResolvedValue(null);
      mockCounterServiceReal.getById.mockResolvedValue(realData);

      const result = await counterServiceProxy.getById(id);

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockCounterServiceReal.getById).toHaveBeenCalledWith(id);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(`counter:id:${id}`),
        JSON.stringify(realData),
        3600
      );
      expect(result).toEqual(realData);
    });
  });

  describe('create', () => {
    it('should call real service and invalidate cache', async () => {
      const data = { counterNumber: 'C1' };
      const createdData = { id: 1, ...data };
      mockCounterServiceReal.create.mockResolvedValue(createdData);

      const result = await counterServiceProxy.create(data);

      expect(mockCounterServiceReal.create).toHaveBeenCalledWith(data);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(createdData);
    });
  });

  describe('update', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'counter-1';
      const data = { counterNumber: 'C2' };
      const updatedData = { id, ...data };
      mockCounterServiceReal.update.mockResolvedValue(updatedData);

      const result = await counterServiceProxy.update(id, data);

      expect(mockCounterServiceReal.update).toHaveBeenCalledWith(id, data);
      expect(mockCacheService.del).toHaveBeenCalledWith(`counter:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(updatedData);
    });
  });

  describe('remove', () => {
    it('should call real service, delete specific cache and invalidate prefix', async () => {
      const id = 'counter-1';
      const deletedData = { id, counterNumber: 'C1' };
      mockCounterServiceReal.remove.mockResolvedValue(deletedData);

      const result = await counterServiceProxy.remove(id);

      expect(mockCounterServiceReal.remove).toHaveBeenCalledWith(id);
      expect(mockCacheService.del).toHaveBeenCalledWith(`counter:id:${id}`);
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('counter:');
      expect(result).toEqual(deletedData);
    });
  });
});
