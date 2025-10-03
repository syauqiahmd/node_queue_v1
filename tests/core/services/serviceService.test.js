const ServiceService = require('@src/core/services/serviceService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('ServiceService', () => {
  let serviceService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
      service: {
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

    serviceService = new ServiceService({
      prismaClient,
      businessException,
    });
  });

  describe('getAll', () => {
    it('should return a list of services', async () => {
      const mockServices = [{ id: 's1' }];
      prismaClient.service.findMany.mockResolvedValue(mockServices);
      prismaClient.service.count.mockResolvedValue(1);

      const result = await serviceService.getAll({});

      expect(prismaClient.service.findMany).toHaveBeenCalled();
      expect(prismaClient.service.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: 1, data: mockServices });
    });

    it('should apply filters', async () => {
      const mockServices = [{ id: 's1' }];
      prismaClient.service.findMany.mockResolvedValue(mockServices);
      prismaClient.service.count.mockResolvedValue(1);

      const result = await serviceService.getAll({
        name: 'test',
        prefix: 'T',
        isActive: 'true',
        page: 1,
        pageSize: 10,
      });

      expect(prismaClient.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'test', mode: 'insensitive' },
            prefix: { contains: 'T', mode: 'insensitive' },
            isActive: true,
          }),
          skip: 0,
          take: 10,
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockServices });
    });

    it('should handle isActive false filter', async () => {
      const mockServices = [{ id: 's1' }];
      prismaClient.service.findMany.mockResolvedValue(mockServices);
      prismaClient.service.count.mockResolvedValue(1);

      const result = await serviceService.getAll({
        isActive: 'false',
      });

      expect(prismaClient.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockServices });
    });
  });

  describe('getById', () => {
    it('should return a service by ID', async () => {
      const mockService = { id: 's1' };
      prismaClient.service.findUnique.mockResolvedValue(mockService);

      const result = await serviceService.getById('s1');

      expect(prismaClient.service.findUnique).toHaveBeenCalledWith({
        where: { id: 's1' },
        include: {
          organization: true,
        },
      });
      expect(result).toEqual(mockService);
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const mockService = { id: 's1', name: 'test' };
      prismaClient.service.create.mockResolvedValue(mockService);

      const result = await serviceService.create({ name: 'test' });

      expect(prismaClient.service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'test',
          }),
        })
      );
      expect(result).toEqual(mockService);
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const mockService = { id: 's1', name: 'updated' };
      prismaClient.service.update.mockResolvedValue(mockService);

      const result = await serviceService.update('s1', { name: 'updated' });

      expect(prismaClient.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: { name: 'updated' },
      });
      expect(result).toEqual(mockService);
    });
  });

  describe('remove', () => {
    it('should remove a service', async () => {
      const mockService = { id: 's1' };
      prismaClient.service.delete.mockResolvedValue(mockService);

      const result = await serviceService.remove('s1');

      expect(prismaClient.service.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
      expect(result).toEqual(mockService);
    });
  });
});
