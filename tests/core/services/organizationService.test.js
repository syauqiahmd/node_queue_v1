const OrganizationService = require('@src/core/services/organizationService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('OrganizationService', () => {
  let organizationService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
      organization: {
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

    organizationService = new OrganizationService({
      prismaClient,
      businessException,
    });
  });

  describe('getAll', () => {
    it('should return a list of organizations', async () => {
      const mockOrganizations = [{ id: 'o1' }];
      prismaClient.organization.findMany.mockResolvedValue(mockOrganizations);
      prismaClient.organization.count.mockResolvedValue(1);

      const result = await organizationService.getAll({});

      expect(prismaClient.organization.findMany).toHaveBeenCalled();
      expect(prismaClient.organization.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: 1, data: mockOrganizations });
    });

    it('should apply filters', async () => {
      const mockOrganizations = [{ id: 'o1' }];
      prismaClient.organization.findMany.mockResolvedValue(mockOrganizations);
      prismaClient.organization.count.mockResolvedValue(1);

      const result = await organizationService.getAll({
        name: 'test',
        fullName: 'Test Org',
        isActive: 'true',
        page: 1,
        pageSize: 10,
      });

      expect(prismaClient.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'test', mode: 'insensitive' },
            fullName: { contains: 'Test Org', mode: 'insensitive' },
            isActive: true,
          }),
          skip: 0,
          take: 10,
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockOrganizations });
    });

    it('should handle isActive false filter', async () => {
      const mockOrganizations = [{ id: 'o1' }];
      prismaClient.organization.findMany.mockResolvedValue(mockOrganizations);
      prismaClient.organization.count.mockResolvedValue(1);

      const result = await organizationService.getAll({
        isActive: 'false',
      });

      expect(prismaClient.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockOrganizations });
    });
  });

  describe('getById', () => {
    it('should return an organization by ID', async () => {
      const mockOrganization = { id: 'o1' };
      prismaClient.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await organizationService.getById('o1');

      expect(prismaClient.organization.findUnique).toHaveBeenCalledWith({ where: { id: 'o1' } });
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const mockOrganization = { id: 'o1', name: 'test' };
      prismaClient.organization.create.mockResolvedValue(mockOrganization);

      const result = await organizationService.create({ name: 'test' });

      expect(prismaClient.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'test',
          }),
        })
      );
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const mockOrganization = { id: 'o1', name: 'updated' };
      prismaClient.organization.update.mockResolvedValue(mockOrganization);

      const result = await organizationService.update('o1', { name: 'updated' });

      expect(prismaClient.organization.update).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { name: 'updated' },
      });
      expect(result).toEqual(mockOrganization);
    });
  });

  describe('remove', () => {
    it('should remove an organization', async () => {
      const mockOrganization = { id: 'o1' };
      prismaClient.organization.delete.mockResolvedValue(mockOrganization);

      const result = await organizationService.remove('o1');

      expect(prismaClient.organization.delete).toHaveBeenCalledWith({ where: { id: 'o1' } });
      expect(result).toEqual(mockOrganization);
    });
  });
});
