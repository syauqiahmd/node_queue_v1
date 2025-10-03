const CounterService = require('@src/core/services/counterService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('CounterService', () => {
  let counterService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
      counter: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };

    counterService = new CounterService({
      prismaClient,
      businessException,
    });
  });

  describe('getAll', () => {
    it('should return a list of counters', async () => {
      const mockCounters = [{ id: 'c1' }];
      prismaClient.counter.findMany.mockResolvedValue(mockCounters);
      prismaClient.counter.count.mockResolvedValue(1);

      const result = await counterService.getAll({});

      expect(prismaClient.counter.findMany).toHaveBeenCalled();
      expect(prismaClient.counter.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: 1, data: mockCounters });
    });

    // it('should apply filters', async () => {
    //   const mockCounters = [{ id: 'c1' }];
    //   prismaClient.counter.findMany.mockResolvedValue(mockCounters);
    //   prismaClient.counter.count.mockResolvedValue(1);

    //   const result = await counterService.getAll({
    //     name: 'test',
    //     serviceId: 's1',
    //     isActive: 'true',
    //     page: 1,
    //     pageSize: 10,
    //   });

    //   expect(prismaClient.counter.findMany).toHaveBeenCalledWith({
    //     where: {
    //       name: { contains: 'test', mode: 'insensitive' },
    //       serviceId: 's1',
    //       isActive: true,
    //     },
    //     skip: 0,
    //     take: 10,
    //     orderBy: { createdAt: 'desc' },
    //     include: {
    //       service: {
    //         include: {
    //           organization: true,
    //         },
    //       },
    //     },
    //   });
    //   expect(result).toEqual({ totalRecord: 1, data: mockCounters });
    // });

    it('should handle isActive false filter', async () => {
      const mockCounters = [{ id: 'c1' }];
      prismaClient.counter.findMany.mockResolvedValue(mockCounters);
      prismaClient.counter.count.mockResolvedValue(1);

      const result = await counterService.getAll({
        isActive: 'false',
      });

      expect(prismaClient.counter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockCounters });
    });
  });

  describe('getById', () => {
    it('should return a counter by ID', async () => {
      const mockCounter = { id: 'c1' };
      prismaClient.counter.findUnique.mockResolvedValue(mockCounter);

      const result = await counterService.getById('c1');

      expect(prismaClient.counter.findUnique).toHaveBeenCalledWith({
        where: { id: 'c1' },
        include: {
          service: {
            include: {
              organization: true,
            },
          },
        },
      });
      expect(result).toEqual(mockCounter);
    });
  });

  describe('create', () => {
    it('should create a new counter', async () => {
      const mockCounter = { id: 'c1', name: 'test' };
      prismaClient.counter.create.mockResolvedValue(mockCounter);

      const result = await counterService.create({ name: 'test' });

      expect(prismaClient.counter.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'test',
          }),
        })
      );
      expect(result).toEqual(mockCounter);
    });
  });

  describe('update', () => {
    it('should update a counter', async () => {
      const mockCounter = { id: 'c1', name: 'updated' };
      prismaClient.counter.update.mockResolvedValue(mockCounter);

      const result = await counterService.update('c1', { name: 'updated' });

      expect(prismaClient.counter.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { name: 'updated' },
      });
      expect(result).toEqual(mockCounter);
    });
  });

  describe('remove', () => {
    it('should remove a counter', async () => {
      const mockCounter = { id: 'c1' };
      prismaClient.counter.delete.mockResolvedValue(mockCounter);

      const result = await counterService.remove('c1');

      expect(prismaClient.counter.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
      expect(result).toEqual(mockCounter);
    });
  });
});
