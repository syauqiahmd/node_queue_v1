const CounterService = require('../../../src/core/services/counterService');

describe('CounterService', () => {
  let counterService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      counter: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    counterService = new CounterService({
      prismaClient: mockPrisma,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list of counters', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'counterNumber', sortOrder: 'asc' };
      const mockCounters = [{ id: 1, counterNumber: 'C1' }];
      const mockCount = 1;

      mockPrisma.counter.findMany.mockResolvedValue(mockCounters);
      mockPrisma.counter.count.mockResolvedValue(mockCount);

      const result = await counterService.getAll(payload);

      expect(mockPrisma.counter.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { counterNumber: 'asc' },
        include: { service: { include: { organization: true } } },
      }));
      expect(mockPrisma.counter.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: mockCount, data: mockCounters });
    });

    it('should return list without pagination if pagination is "false"', async () => {
      const payload = { pagination: 'false', sortBy: 'counterNumber', sortOrder: 'asc' };
      const mockCounters = [{ id: 1, counterNumber: 'C1' }];
      const mockCount = 1;

      mockPrisma.counter.findMany.mockResolvedValue(mockCounters);
      mockPrisma.counter.count.mockResolvedValue(mockCount);

      const result = await counterService.getAll(payload);

      expect(mockPrisma.counter.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { counterNumber: 'asc' },
        include: { service: { include: { organization: true } } },
      }));
      expect(mockPrisma.counter.findMany).not.toHaveBeenCalledWith(expect.objectContaining({
        skip: expect.any(Number),
        take: expect.any(Number),
      }));
      expect(result).toEqual({ totalRecord: mockCount, data: mockCounters });
    });

    it('should apply filters correctly', async () => {
      const payload = {
        counterNumber: '1',
        serviceId: 'service-1',
        isActive: 'true',
        page: 1,
        pageSize: 10,
        sortBy: 'counterNumber',
        sortOrder: 'asc',
      };

      mockPrisma.counter.findMany.mockResolvedValue([]);
      mockPrisma.counter.count.mockResolvedValue(0);

      await counterService.getAll(payload);

      const expectedWhere = {
        counterNumber: { contains: '1', mode: 'insensitive' },
        serviceId: 'service-1',
        isActive: true,
      };

      expect(mockPrisma.counter.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
      expect(mockPrisma.counter.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should handle boolean isActive filter "false"', async () => {
        const payload = { isActive: 'false', sortBy: 'counterNumber', sortOrder: 'asc', page: 1, pageSize: 10 };
        
        mockPrisma.counter.findMany.mockResolvedValue([]);
        mockPrisma.counter.count.mockResolvedValue(0);
  
        await counterService.getAll(payload);
  
        expect(mockPrisma.counter.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ isActive: false })
        }));
      });
  });

  describe('getById', () => {
    it('should return counter by id', async () => {
      const id = 'counter-1';
      const mockCounter = { id, counterNumber: 'C1' };
      mockPrisma.counter.findUnique.mockResolvedValue(mockCounter);

      const result = await counterService.getById(id);

      expect(mockPrisma.counter.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { service: { include: { organization: true } } },
      });
      expect(result).toEqual(mockCounter);
    });
  });

  describe('create', () => {
    it('should create a new counter', async () => {
      const data = { counterNumber: 'C1', serviceId: 'service-1' };
      const mockCreatedCounter = { id: 'new-id', ...data };
      mockPrisma.counter.create.mockResolvedValue(mockCreatedCounter);

      const result = await counterService.create(data);

      expect(mockPrisma.counter.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreatedCounter);
    });
  });

  describe('update', () => {
    it('should update an existing counter', async () => {
      const id = 'counter-1';
      const data = { counterNumber: 'C2' };
      const mockUpdatedCounter = { id, ...data };
      mockPrisma.counter.update.mockResolvedValue(mockUpdatedCounter);

      const result = await counterService.update(id, data);

      expect(mockPrisma.counter.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
      expect(result).toEqual(mockUpdatedCounter);
    });
  });

  describe('remove', () => {
    it('should delete a counter', async () => {
      const id = 'counter-1';
      const mockDeletedCounter = { id, counterNumber: 'C1' };
      mockPrisma.counter.delete.mockResolvedValue(mockDeletedCounter);

      const result = await counterService.remove(id);

      expect(mockPrisma.counter.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockDeletedCounter);
    });
  });
});
