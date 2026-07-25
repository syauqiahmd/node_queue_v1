const VisitorHistoryService = require('../../../src/core/services/visitorHistoryService');

describe('VisitorHistoryService', () => {
  let visitorHistoryService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      visitorHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    visitorHistoryService = new VisitorHistoryService({ prismaClient: mockPrisma });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('getAll', () => {
    it('should return paginated list with visitor/organization included', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' };
      const mockHistories = [{ id: 'history-1' }];
      mockPrisma.visitorHistory.findMany.mockResolvedValue(mockHistories);
      mockPrisma.visitorHistory.count.mockResolvedValue(1);

      const result = await visitorHistoryService.getAll(payload);

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            visitor: { select: { id: true, name: true, phoneNumber: true, email: true } },
            organization: { select: { id: true, name: true, fullName: true } },
          },
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockHistories });
    });

    it('should filter by visitorId, organizationId, and joined visitor/organization fields', async () => {
      const payload = {
        visitorId: 'visitor-1',
        organizationId: 'org-1',
        name: 'John',
        phoneNumber: '6281',
        email: 'john@',
        organizationName: 'Main',
        organizationFullName: 'Main Branch',
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      mockPrisma.visitorHistory.findMany.mockResolvedValue([]);
      mockPrisma.visitorHistory.count.mockResolvedValue(0);

      await visitorHistoryService.getAll(payload);

      const expectedWhere = {
        visitorId: 'visitor-1',
        organizationId: 'org-1',
        visitor: {
          name: { contains: 'John', mode: 'insensitive' },
          phoneNumber: { contains: '6281', mode: 'insensitive' },
          email: { contains: 'john@', mode: 'insensitive' },
        },
        organization: {
          name: { contains: 'Main', mode: 'insensitive' },
          fullName: { contains: 'Main Branch', mode: 'insensitive' },
        },
      };

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      );
      expect(mockPrisma.visitorHistory.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should filter by visitDate truncated to the day', async () => {
      const payload = {
        visitDate: '2026-07-17T15:30:00.000Z',
        page: 1,
        pageSize: 10,
        sortBy: 'visitDate',
        sortOrder: 'desc',
      };

      mockPrisma.visitorHistory.findMany.mockResolvedValue([]);
      mockPrisma.visitorHistory.count.mockResolvedValue(0);

      await visitorHistoryService.getAll(payload);

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visitDate: new Date('2026-07-17T00:00:00.000Z'),
          }),
        })
      );
    });

    it('should return list without pagination if pagination is "false"', async () => {
      const payload = { pagination: 'false', sortBy: 'createdAt', sortOrder: 'desc' };
      mockPrisma.visitorHistory.findMany.mockResolvedValue([]);
      mockPrisma.visitorHistory.count.mockResolvedValue(0);

      await visitorHistoryService.getAll(payload);

      expect(mockPrisma.visitorHistory.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          skip: expect.any(Number),
          take: expect.any(Number),
        })
      );
    });
  });

  describe('getReport', () => {
    it('should filter by visitDate date range and order by createdAt asc', async () => {
      const payload = { startDate: '2026-07-01', endDate: '2026-07-31' };
      const mockRows = [{ id: 'history-1' }];
      mockPrisma.visitorHistory.findMany.mockResolvedValue(mockRows);

      const result = await visitorHistoryService.getReport(payload);

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          visitDate: {
            gte: new Date('2026-07-01'),
            lte: new Date('2026-07-31'),
          },
        }),
        orderBy: { createdAt: 'asc' },
        include: {
          visitor: { select: { id: true, name: true, phoneNumber: true, email: true } },
          organization: { select: { id: true, name: true, fullName: true } },
        },
      });
      expect(result).toEqual(mockRows);
    });

    it('should leave lte undefined when endDate is not provided', async () => {
      mockPrisma.visitorHistory.findMany.mockResolvedValue([]);

      await visitorHistoryService.getReport({ startDate: '2026-07-01' });

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visitDate: { gte: new Date('2026-07-01'), lte: undefined },
          }),
        })
      );
    });

    it('should apply visitorId, organizationId, and joined visitor/organization filters', async () => {
      const payload = {
        visitorId: 'visitor-1',
        organizationId: 'org-1',
        name: 'John',
        phoneNumber: '6281',
        email: 'john@',
        organizationName: 'Main',
        organizationFullName: 'Main Branch',
        startDate: '2026-07-01',
      };
      mockPrisma.visitorHistory.findMany.mockResolvedValue([]);

      await visitorHistoryService.getReport(payload);

      expect(mockPrisma.visitorHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visitorId: 'visitor-1',
            organizationId: 'org-1',
            visitor: {
              name: { contains: 'John', mode: 'insensitive' },
              phoneNumber: { contains: '6281', mode: 'insensitive' },
              email: { contains: 'john@', mode: 'insensitive' },
            },
            organization: {
              name: { contains: 'Main', mode: 'insensitive' },
              fullName: { contains: 'Main Branch', mode: 'insensitive' },
            },
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should record the visit with a GMT+8 day-truncated visitDate and timestamp createdAt', async () => {
      const visitorId = 'visitor-1';
      const organizationId = 'org-1';

      // 2025-12-31 16:50:30 GMT+8 (which is 2025-12-31 08:50:30 UTC)
      const mockNow = new Date('2025-12-31T08:50:30Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      const mockCreated = {
        id: 'history-1',
        visitorId,
        organizationId,
        visitDate: expect.any(Date),
        createdAt: expect.any(Date),
      };
      mockPrisma.visitorHistory.create.mockResolvedValue(mockCreated);

      const result = await visitorHistoryService.create({ visitorId, organizationId });

      // today logic mirrors TicketService:
      // const timeStamp = new Date(Date.now() + 8 * 60 * 60 * 1000);
      // visitDate = timeStamp with setUTCHours(0,0,0,0)
      const expectedTimeStamp = new Date('2025-12-31T16:50:30.000Z');
      const expectedVisitDate = new Date('2025-12-31T00:00:00.000Z');

      expect(mockPrisma.visitorHistory.create).toHaveBeenCalledWith({
        data: {
          visitorId,
          organizationId,
          visitDate: expectedVisitDate,
          createdAt: expectedTimeStamp,
        },
      });
      expect(result).toEqual(mockCreated);
    });

    it('should truncate visitDate to the day boundary near midnight UTC rollover', async () => {
      const visitorId = 'visitor-2';
      const organizationId = 'org-2';

      // 2025-12-31 23:50:00 UTC -> +8h = 2026-01-01 07:50:00, so visitDate should roll to Jan 1st
      const mockNow = new Date('2025-12-31T23:50:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      mockPrisma.visitorHistory.create.mockResolvedValue({});

      await visitorHistoryService.create({ visitorId, organizationId });

      const expectedVisitDate = new Date('2026-01-01T00:00:00.000Z');

      expect(mockPrisma.visitorHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ visitDate: expectedVisitDate }),
        })
      );
    });
  });
});
