const OrganizationService = require('../../../src/core/services/organizationService');
// We don't need to mock the DTO if it's just data transformation, but we need to make sure the data we pass to it is valid.

describe('OrganizationService', () => {
  let organizationService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      organization: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    organizationService = new OrganizationService({
      prismaClient: mockPrisma,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list of organizations', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' };
      const mockOrgs = [{ id: 1, name: 'Org 1' }];
      const mockCount = 1;

      mockPrisma.organization.findMany.mockResolvedValue(mockOrgs);
      mockPrisma.organization.count.mockResolvedValue(mockCount);

      const result = await organizationService.getAll(payload);

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      }));
      expect(mockPrisma.organization.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: mockCount, data: mockOrgs });
    });

    it('should return list without pagination if pagination is "false"', async () => {
        const payload = { pagination: 'false', sortBy: 'name', sortOrder: 'asc' };
        const mockOrgs = [{ id: 1, name: 'Org 1' }];
        const mockCount = 1;
  
        mockPrisma.organization.findMany.mockResolvedValue(mockOrgs);
        mockPrisma.organization.count.mockResolvedValue(mockCount);
  
        const result = await organizationService.getAll(payload);
  
        expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
          orderBy: { name: 'asc' },
        }));
        expect(mockPrisma.organization.findMany).not.toHaveBeenCalledWith(expect.objectContaining({
            skip: expect.any(Number),
            take: expect.any(Number),
        }));
        expect(result).toEqual({ totalRecord: mockCount, data: mockOrgs });
      });

    it('should apply filters correctly', async () => {
      const payload = {
        name: 'test',
        fullName: 'Test Org',
        isActive: 'true',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockPrisma.organization.findMany.mockResolvedValue([]);
      mockPrisma.organization.count.mockResolvedValue(0);

      await organizationService.getAll(payload);

      const expectedWhere = {
        name: { contains: 'test', mode: 'insensitive' },
        fullName: { contains: 'Test Org', mode: 'insensitive' },
        isActive: true,
      };

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expectedWhere }));
      expect(mockPrisma.organization.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should handle boolean isActive filter "false"', async () => {
        const payload = { isActive: 'false', sortBy: 'name', sortOrder: 'asc', page: 1, pageSize: 10 };
        
        mockPrisma.organization.findMany.mockResolvedValue([]);
        mockPrisma.organization.count.mockResolvedValue(0);
  
        await organizationService.getAll(payload);
  
        expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ isActive: false })
        }));
      });
  });

  describe('getById', () => {
    it('should return organization by id', async () => {
      const id = 'org-1';
      const mockOrg = { id, name: 'Org 1' };
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await organizationService.getById(id);

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockOrg);
    });
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const data = { name: 'New Org' };
      const mockCreatedOrg = { id: 'new-id', ...data };
      mockPrisma.organization.create.mockResolvedValue(mockCreatedOrg);

      const result = await organizationService.create(data);

      expect(mockPrisma.organization.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(mockCreatedOrg);
    });
  });

  describe('update', () => {
    it('should update an existing organization', async () => {
      const id = 'org-1';
      const data = { name: 'Updated Org' };
      const mockUpdatedOrg = { id, ...data };
      mockPrisma.organization.update.mockResolvedValue(mockUpdatedOrg);

      const result = await organizationService.update(id, data);

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id },
        data,
      });
      expect(result).toEqual(mockUpdatedOrg);
    });
  });

  describe('remove', () => {
    it('should delete an organization', async () => {
      const id = 'org-1';
      const mockDeletedOrg = { id, name: 'Org 1' };
      mockPrisma.organization.delete.mockResolvedValue(mockDeletedOrg);

      const result = await organizationService.remove(id);

      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockDeletedOrg);
    });
  });

  describe('getAllWithService', () => {
    it('should return organizations with mapped services', async () => {
      const payload = { isActive: 'true' };
      const mockOrgs = [{
        id: 'org-1',
        name: 'Org 1',
        fullName: 'Organization 1',
        logoUrl: 'https://logo.url',
        services: [
          { id: 'svc-1', name: 'Service 1', prefix: 'A' }
        ]
      }];

      mockPrisma.organization.findMany.mockResolvedValue(mockOrgs);

      const result = await organizationService.getAllWithService(payload);

      expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { isActive: true },
        select: expect.objectContaining({
            services: expect.objectContaining({
                where: { isActive: true }
            })
        }),
        orderBy: { name: 'desc' }
      }));

      // Verify DTO mapping
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('org-1');
      expect(result[0].services).toHaveLength(1);
      expect(result[0].services[0].serviceId).toBe('svc-1');
    });
  });
});
