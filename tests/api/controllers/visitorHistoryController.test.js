const VisitorHistoryController = require('../../../src/api/controllers/visitorHistoryController');

describe('VisitorHistoryController', () => {
  let visitorHistoryController;
  let mockVisitorHistoryService;
  let mockIdentityHelper;
  let mockBusinessException;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockVisitorHistoryService = {
      create: jest.fn(),
      getAll: jest.fn(),
      getReport: jest.fn(),
    };

    mockIdentityHelper = {
      getCurrentUserRole: jest.fn().mockReturnValue('ADMIN'),
      getCurrentUserOrganizationId: jest.fn().mockReturnValue(null),
    };

    mockBusinessException = {
      Forbidden: jest.fn((msg) => new Error(msg)),
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();

    visitorHistoryController = new VisitorHistoryController({
      visitorHistoryService: mockVisitorHistoryService,
      identityHelper: mockIdentityHelper,
      businessException: mockBusinessException,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of visitor histories for ADMIN without forcing an organizationId', async () => {
      mockReq.query = { page: '1', pageSize: '10', organizationId: 'org-1' };
      const data = { totalRecord: 1, data: [{ id: 'history-1' }] };
      mockVisitorHistoryService.getAll.mockResolvedValue(data);

      await visitorHistoryController.getAll(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.getAll).toHaveBeenCalledWith({
        organizationId: 'org-1',
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should let ADMIN query across all organizations when none is specified', async () => {
      mockReq.query = {};
      mockVisitorHistoryService.getAll.mockResolvedValue({ totalRecord: 0, data: [] });

      await visitorHistoryController.getAll(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.getAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ organizationId: expect.anything() })
      );
    });

    it('should force USER role to their own organizationId, ignoring any query value', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('USER');
      mockIdentityHelper.getCurrentUserOrganizationId.mockReturnValue('user-org-1');
      mockReq.query = { organizationId: 'someone-elses-org' };
      mockVisitorHistoryService.getAll.mockResolvedValue({ totalRecord: 0, data: [] });

      await visitorHistoryController.getAll(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'user-org-1' })
      );
    });

    it('should throw Forbidden if USER role has no organization assigned', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('USER');
      mockIdentityHelper.getCurrentUserOrganizationId.mockReturnValue(null);

      await visitorHistoryController.getAll(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Forbidden).toHaveBeenCalledWith(
        'User is not assigned to an organization'
      );
      expect(mockVisitorHistoryService.getAll).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors', async () => {
      mockVisitorHistoryService.getAll.mockRejectedValue(new Error('Error'));
      await visitorHistoryController.getAll(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('create', () => {
    it('should record the visitor history', async () => {
      mockReq.body = { visitorId: 'visitor-1', organizationId: 'org-1' };
      const data = { id: 'history-1', ...mockReq.body };
      mockVisitorHistoryService.create.mockResolvedValue(data);

      await visitorHistoryController.create(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.create).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });

    it('should handle errors', async () => {
      mockReq.body = { visitorId: 'visitor-1', organizationId: 'org-1' };
      const error = new Error('Service error');
      mockVisitorHistoryService.create.mockRejectedValue(error);

      await visitorHistoryController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('exportReport', () => {
    const rows = [
      {
        visitor: { name: 'John Doe', phoneNumber: '6281234567890', email: 'john@test.com' },
        organization: { name: 'Main Branch' },
        visitDate: '2026-07-01T00:00:00.000Z',
        createdAt: '2026-07-01T10:00:00.000Z',
      },
    ];

    it('should let ADMIN export without forcing an organizationId', async () => {
      mockReq.body = { startDate: '2026-07-01' };
      mockVisitorHistoryService.getReport.mockResolvedValue(rows);

      await visitorHistoryController.exportReport(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.getReport).toHaveBeenCalledWith({
        organizationId: undefined,
        startDate: '2026-07-01',
        endDate: '2026-07-01',
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=laporan_riwayat_kunjungan_2026-07-01_2026-07-01.csv'
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining(
          'John Doe,6281234567890,john@test.com,Main Branch,2026-07-01,2026-07-01'
        )
      );
    });

    it('should force USER role to their own organizationId', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('USER');
      mockIdentityHelper.getCurrentUserOrganizationId.mockReturnValue('user-org-1');
      mockReq.body = { startDate: '2026-07-01' };
      mockVisitorHistoryService.getReport.mockResolvedValue(rows);

      await visitorHistoryController.exportReport(mockReq, mockRes, mockNext);

      expect(mockVisitorHistoryService.getReport).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'user-org-1' })
      );
    });

    it('should reject a USER passing a mismatched organizationId with Forbidden', async () => {
      mockIdentityHelper.getCurrentUserRole.mockReturnValue('USER');
      mockIdentityHelper.getCurrentUserOrganizationId.mockReturnValue('user-org-1');
      mockReq.body = { startDate: '2026-07-01', organizationId: 'someone-elses-org' };

      await visitorHistoryController.exportReport(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Forbidden).toHaveBeenCalledWith('Insufficient permissions');
      expect(mockVisitorHistoryService.getReport).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw NotFound when there are no matching rows', async () => {
      mockReq.body = { startDate: '2026-07-01' };
      mockVisitorHistoryService.getReport.mockResolvedValue([]);

      await visitorHistoryController.exportReport(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('VisitorHistory');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.send).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockReq.body = { startDate: '2026-07-01' };
      const error = new Error('Service error');
      mockVisitorHistoryService.getReport.mockRejectedValue(error);

      await visitorHistoryController.exportReport(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
