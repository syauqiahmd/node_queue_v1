const ServiceController = require('../../../src/api/controllers/serviceController');

describe('ServiceController', () => {
  let serviceController;
  let mockServiceService;
  let mockBusinessException;
  let mockIdentityHelper;
  let mockLogger;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockServiceService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      publicGetAll: jest.fn(),
    };

    mockBusinessException = {
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockIdentityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue(1),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
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

    serviceController = new ServiceController({
      serviceService: mockServiceService,
      businessException: mockBusinessException,
      identityHelper: mockIdentityHelper,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of services', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const data = [{ id: 1, name: 'S1' }];
      mockServiceService.getAll.mockResolvedValue(data);

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(mockServiceService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockServiceService.getAll.mockRejectedValue(error);

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return service by id', async () => {
      mockReq.params.serviceId = 's-1';
      const data = { id: 's-1', name: 'S1' };
      mockServiceService.getById.mockResolvedValue(data);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockServiceService.getById).toHaveBeenCalledWith('s-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should throw NotFound if service not found', async () => {
      mockReq.params.serviceId = 's-1';
      mockServiceService.getById.mockResolvedValue(null);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Service');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      const error = new Error('Service error');
      mockServiceService.getById.mockRejectedValue(error);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create service', async () => {
      mockReq.body = { name: 'S1' };
      const data = { id: 1, name: 'S1' };
      mockServiceService.create.mockResolvedValue(data);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(mockServiceService.create).toHaveBeenCalledWith({
        name: 'S1',
        createdBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'S1' };
      const error = new Error('Service error');
      mockServiceService.create.mockRejectedValue(error);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update service', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.body = { name: 'S2' };
      const data = { id: 's-1', name: 'S2' };
      mockServiceService.update.mockResolvedValue(data);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(mockServiceService.update).toHaveBeenCalledWith('s-1', {
        name: 'S2',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.body = { name: 'S2' };
      const error = new Error('Service error');
      mockServiceService.update.mockRejectedValue(error);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('should remove service', async () => {
      mockReq.params.serviceId = 's-1';
      const data = { id: 's-1' };
      mockServiceService.remove.mockResolvedValue(data);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(mockServiceService.remove).toHaveBeenCalledWith('s-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Deleted' });
    });

    it('should handle errors', async () => {
      mockReq.params.serviceId = 's-1';
      const error = new Error('Service error');
      mockServiceService.remove.mockRejectedValue(error);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('publicServiceList', () => {
    it('should return public service list formatted', async () => {
      const data = [{
        id: 1,
        name: 'S1',
        prefix: 'A',
        organization: {
          id: 'org-1',
          name: 'Org 1',
          fullName: 'Organization 1',
          logoUrl: 'https://logo.url'
        }
      }];
      mockServiceService.publicGetAll.mockResolvedValue({ totalRecord: 1, data });

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockServiceService.publicGetAll).toHaveBeenCalledWith({ isActive: 'true' }, false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalRecord: 1,
          data: [{
            id: 1,
            name: 'S1',
            prefix: 'A',
            organization: {
              id: 'org-1',
              name: 'Org 1',
              fullName: 'Organization 1',
              logoUrl: 'https://logo.url'
            }
          }]
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockServiceService.publicGetAll.mockRejectedValue(error);

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should return null for logoUrl if not present', async () => {
      const data = [{
        id: 1,
        name: 'S1',
        prefix: 'A',
        organization: {
          id: 'org-1',
          name: 'Org 1',
          fullName: 'Organization 1'
          // No logoUrl
        }
      }];
      mockServiceService.publicGetAll.mockResolvedValue({ totalRecord: 1, data });

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              organization: expect.objectContaining({
                logoUrl: null
              })
            })
          ])
        })
      }));
    });
  });
});
