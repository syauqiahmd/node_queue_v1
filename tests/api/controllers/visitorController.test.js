const VisitorController = require('../../../src/api/controllers/visitorController');

describe('VisitorController', () => {
  let visitorController;
  let mockVisitorService;
  let mockReq;
  let mockRes;
  let mockNext;

  let mockBusinessException;

  beforeEach(() => {
    mockVisitorService = {
      getAll: jest.fn(),
      upsertByPhoneNumber: jest.fn(),
      getReport: jest.fn(),
    };

    mockBusinessException = {
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

    visitorController = new VisitorController({
      visitorService: mockVisitorService,
      businessException: mockBusinessException,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of visitors', async () => {
      mockReq.query = { page: '1', pageSize: '10', name: 'John' };
      const data = { totalRecord: 1, data: [{ id: 1, name: 'John' }] };
      mockVisitorService.getAll.mockResolvedValue(data);

      await visitorController.getAll(mockReq, mockRes, mockNext);

      expect(mockVisitorService.getAll).toHaveBeenCalledWith({
        name: 'John',
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should pass through an organizationId filter', async () => {
      mockReq.query = { organizationId: 'org-1' };
      mockVisitorService.getAll.mockResolvedValue({ totalRecord: 0, data: [] });

      await visitorController.getAll(mockReq, mockRes, mockNext);

      expect(mockVisitorService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' })
      );
    });

    it('should handle errors', async () => {
      mockVisitorService.getAll.mockRejectedValue(new Error('Error'));
      await visitorController.getAll(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('upsert', () => {
    it('should upsert visitor by phone number', async () => {
      mockReq.body = { name: 'John Doe', phoneNumber: '081234567890' };
      const data = { id: 'visitor-1', name: 'John Doe', phoneNumber: '6281234567890' };
      mockVisitorService.upsertByPhoneNumber.mockResolvedValue(data);

      await visitorController.upsert(mockReq, mockRes, mockNext);

      expect(mockVisitorService.upsertByPhoneNumber).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'John Doe', phoneNumber: 'invalid' };
      const error = new Error('Invalid phone number format');
      mockVisitorService.upsertByPhoneNumber.mockRejectedValue(error);

      await visitorController.upsert(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('exportReport', () => {
    it('should default endDate to startDate and stream a CSV response', async () => {
      mockReq.body = { startDate: '2026-07-01', name: 'John' };
      const rows = [
        {
          name: 'John Doe',
          phoneNumber: '6281234567890',
          email: 'john@test.com',
          createdAt: '2026-07-01T10:00:00.000Z',
        },
      ];
      mockVisitorService.getReport.mockResolvedValue(rows);

      await visitorController.exportReport(mockReq, mockRes, mockNext);

      expect(mockVisitorService.getReport).toHaveBeenCalledWith({
        name: 'John',
        startDate: '2026-07-01',
        endDate: '2026-07-01',
      });
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=laporan_pengunjung_2026-07-01_2026-07-01.csv'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('John Doe,6281234567890,john@test.com,2026-07-01')
      );
    });

    it('should throw NotFound when there are no matching rows', async () => {
      mockReq.body = { startDate: '2026-07-01' };
      mockVisitorService.getReport.mockResolvedValue([]);

      await visitorController.exportReport(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Visitor');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockRes.send).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockReq.body = { startDate: '2026-07-01' };
      const error = new Error('Service error');
      mockVisitorService.getReport.mockRejectedValue(error);

      await visitorController.exportReport(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
