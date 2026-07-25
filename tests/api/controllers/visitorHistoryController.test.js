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
    };

    mockIdentityHelper = {
      getCurrentUserRole: jest.fn().mockReturnValue('ADMIN'),
      getCurrentUserOrganizationId: jest.fn().mockReturnValue(null),
    };

    mockBusinessException = {
      Forbidden: jest.fn((msg) => new Error(msg)),
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
});
