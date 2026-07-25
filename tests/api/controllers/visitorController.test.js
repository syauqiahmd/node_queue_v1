const VisitorController = require('../../../src/api/controllers/visitorController');

describe('VisitorController', () => {
  let visitorController;
  let mockVisitorService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockVisitorService = {
      getAll: jest.fn(),
      upsertByPhoneNumber: jest.fn(),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    visitorController = new VisitorController({
      visitorService: mockVisitorService,
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
});
