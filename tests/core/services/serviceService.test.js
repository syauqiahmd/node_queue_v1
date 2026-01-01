const ServiceService = require('../../../src/core/services/serviceService');

describe('ServiceService', () => {
  let serviceService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      service: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    serviceService = new ServiceService({
      prismaClient: mockPrisma,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list of services', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' };
      const mockServices = [{ id: 1, name: 'Service 1' }];
      const mockCount = 1;

      mockPrisma.service.findMany.mockResolvedValue(mockServices);
      mockPrisma.service.count.mockResolvedValue(mockCount);

      const result = await serviceService.getAll(payload);

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: { organization: true },
      }));
      expect(mockPrisma.service.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: mockCount, data: mockServices });
    });

    it('should return list without pagination if pagination is false', async () => {
      const payload = { sortBy: 'name', sortOrder: 'asc' };
      const mockServices = [{ id: 1, name: 'Service 1' }];
      const mockCount = 1;

      mockPrisma.service.findMany.mockResolvedValue(mockServices);
      mockPrisma.service.count.mockResolvedValue(mockCount);

      const result = await serviceService.getAll(payload, false);

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { name: 'asc' },
        include: { organization: true },
      }));
      expect(mockPrisma.service.findMany).not.toHaveBeenCalledWith(expect.objectContaining({
        skip: expect.any(Number),
        take: expect.any(Number),
      }));
      expect(result).toEqual({ totalRecord: mockCount, data: mockServices });
    });

    it('should apply filters correctly', async () => {
      const payload = {
        name: 'test',
        prefix: 'A',
        organizationId: 'org-1',
        isActive: 'true',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);

      await serviceService.getAll(payload);

      const expectedWhere = {
        name: { contains: 'test', mode: 'insensitive' },
        prefix: { contains: 'A', mode: 'insensitive' },
        organizationId: 'org-1',
        isActive: true,
      };

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
      expect(mockPrisma.service.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should handle boolean isActive filter "false"', async () => {
      const payload = { isActive: 'false', sortBy: 'name', sortOrder: 'asc' };
      
      mockPrisma.service.findMany.mockResolvedValue([]);
      mockPrisma.service.count.mockResolvedValue(0);

      await serviceService.getAll(payload);

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isActive: false })
      }));
    });
  });

  describe('publicGetAll', () => {
    it('should return paginated list of public services with active organization', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' };
      const mockServices = [{ id: 1, name: 'Service 1' }];
      const mockCount = 1;

      mockPrisma.service.findMany.mockResolvedValue(mockServices);
      mockPrisma.service.count.mockResolvedValue(mockCount);

      const result = await serviceService.publicGetAll(payload);

      expect(mockPrisma.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          organization: { isActive: true }
        }),
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: { organization: true },
      }));
      expect(mockPrisma.service.count).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
            organization: { isActive: true }
        })
      }));
      expect(result).toEqual({ totalRecord: mockCount, data: mockServices });
    });
  });

  describe('getById', () => {
    it('should return service by id', async () => {
      const id = 'service-1';
      const mockService = { id, name: 'Service 1' };
      mockPrisma.service.findUnique.mockResolvedValue(mockService);

      const result = await serviceService.getById(id);

      expect(mockPrisma.service.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { organization: true },
      });
      expect(result).toEqual(mockService);
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const data = { name: 'New Service', organizationId: 'org-1' };
      const mockCreatedService = { id: 'new-id', ...data };
      mockPrisma.service.create.mockResolvedValue(mockCreatedService);

      const result = await serviceService.create(data);

      expect(mockPrisma.service.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreatedService);
    });
  });

  describe('update', () => {
    it('should update an existing service', async () => {
      const id = 'service-1';
      const data = { name: 'Updated Service' };
      const mockUpdatedService = { id, ...data };
      mockPrisma.service.update.mockResolvedValue(mockUpdatedService);

      const result = await serviceService.update(id, data);

      expect(mockPrisma.service.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
      expect(result).toEqual(mockUpdatedService);
    });
  });

  describe('remove', () => {
    it('should delete a service', async () => {
      const id = 'service-1';
      const mockDeletedService = { id, name: 'Service 1' };
      mockPrisma.service.delete.mockResolvedValue(mockDeletedService);

      const result = await serviceService.remove(id);

      expect(mockPrisma.service.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockDeletedService);
    });
  });
});
