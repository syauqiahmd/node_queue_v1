const VisitorService = require('../../../src/core/services/visitorService');

describe('VisitorService', () => {
  let visitorService;
  let mockPrisma;
  let mockPhoneNormalizer;

  beforeEach(() => {
    mockPrisma = {
      visitor: {
        findMany: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
      },
    };

    mockPhoneNormalizer = {
      normalize: jest.fn((phone) => phone),
    };

    visitorService = new VisitorService({
      prismaClient: mockPrisma,
      phoneNormalizer: mockPhoneNormalizer,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list of visitors', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' };
      const mockVisitors = [{ id: 1, name: 'Visitor 1' }];
      const mockCount = 1;

      mockPrisma.visitor.findMany.mockResolvedValue(mockVisitors);
      mockPrisma.visitor.count.mockResolvedValue(mockCount);

      const result = await visitorService.getAll(payload);

      expect(mockPrisma.visitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { name: 'asc' },
        })
      );
      expect(mockPrisma.visitor.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: mockCount, data: mockVisitors });
    });

    it('should return list without pagination if pagination is "false"', async () => {
      const payload = { pagination: 'false', sortBy: 'name', sortOrder: 'asc' };
      mockPrisma.visitor.findMany.mockResolvedValue([]);
      mockPrisma.visitor.count.mockResolvedValue(0);

      await visitorService.getAll(payload);

      expect(mockPrisma.visitor.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          skip: expect.any(Number),
          take: expect.any(Number),
        })
      );
    });

    it('should AND-combine name, phoneNumber and email filters', async () => {
      const payload = {
        name: 'John',
        phoneNumber: '6281',
        email: 'john@',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockPrisma.visitor.findMany.mockResolvedValue([]);
      mockPrisma.visitor.count.mockResolvedValue(0);

      await visitorService.getAll(payload);

      const expectedWhere = {
        name: { contains: 'John', mode: 'insensitive' },
        phoneNumber: { contains: '6281', mode: 'insensitive' },
        email: { contains: 'john@', mode: 'insensitive' },
      };

      expect(mockPrisma.visitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      );
      expect(mockPrisma.visitor.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should filter by organizationId via the histories relation', async () => {
      const payload = {
        organizationId: 'org-1',
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockPrisma.visitor.findMany.mockResolvedValue([]);
      mockPrisma.visitor.count.mockResolvedValue(0);

      await visitorService.getAll(payload);

      expect(mockPrisma.visitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            histories: { some: { organizationId: 'org-1' } },
          }),
        })
      );
    });
  });

  describe('upsertByPhoneNumber', () => {
    it('should normalize the phone number and upsert by it', async () => {
      mockPhoneNormalizer.normalize.mockReturnValue('6281234567890');
      const data = { name: 'John Doe', phoneNumber: '081234567890', email: 'john@example.com' };
      const upserted = { id: 'visitor-1', ...data, phoneNumber: '6281234567890' };
      mockPrisma.visitor.upsert.mockResolvedValue(upserted);

      const result = await visitorService.upsertByPhoneNumber(data);

      expect(mockPhoneNormalizer.normalize).toHaveBeenCalledWith('081234567890');
      expect(mockPrisma.visitor.upsert).toHaveBeenCalledWith({
        where: { phoneNumber: '6281234567890' },
        create: {
          name: 'John Doe',
          phoneNumber: '6281234567890',
          email: 'john@example.com',
        },
        update: {
          name: 'John Doe',
          email: 'john@example.com',
          updatedBy: '-1',
        },
      });
      expect(result).toEqual(upserted);
    });
  });
});
