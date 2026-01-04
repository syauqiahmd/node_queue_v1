const OrganizationController = require('../../../src/api/controllers/organizationController');

describe('OrganizationController', () => {
  let organizationController;
  let mockOrganizationService;
  let mockBusinessException;
  let mockIdentityHelper;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockOrganizationService = {
      getAll: jest.fn(),
      getAllWithService: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockBusinessException = {
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockIdentityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue(1),
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

    organizationController = new OrganizationController({
      organizationService: mockOrganizationService,
      businessException: mockBusinessException,
      identityHelper: mockIdentityHelper,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of organizations', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const data = [{ id: 1, name: 'Org 1' }];
      mockOrganizationService.getAll.mockResolvedValue(data);

      await organizationController.getAll(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      mockOrganizationService.getAll.mockRejectedValue(new Error('Error'));
      await organizationController.getAll(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPublicList', () => {
    it('should return public list of organizations', async () => {
      const data = [{ id: 1, name: 'Org 1', services: [] }];
      mockOrganizationService.getAllWithService.mockResolvedValue(data);

      await organizationController.getPublicList(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.getAllWithService).toHaveBeenCalledWith({ isActive: 'true' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      mockOrganizationService.getAllWithService.mockRejectedValue(error);

      await organizationController.getPublicList(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return organization by id', async () => {
      mockReq.params.organizationId = 'org-1';
      const data = { id: 'org-1', name: 'Org 1' };
      mockOrganizationService.getById.mockResolvedValue(data);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.getById).toHaveBeenCalledWith('org-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should throw NotFound if organization not found', async () => {
      mockReq.params.organizationId = 'org-1';
      mockOrganizationService.getById.mockResolvedValue(null);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Organization');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors', async () => {
      mockReq.params.organizationId = 'org-1';
      const error = new Error('Service error');
      mockOrganizationService.getById.mockRejectedValue(error);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create organization', async () => {
      mockReq.body = { name: 'Org 1' };
      const data = { id: 1, name: 'Org 1' };
      mockOrganizationService.create.mockResolvedValue(data);

      await organizationController.create(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.create).toHaveBeenCalledWith({
        name: 'Org 1',
        createdBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });

    it('should handle errors', async () => {
      mockReq.body = { name: 'Org 1' };
      const error = new Error('Service error');
      mockOrganizationService.create.mockRejectedValue(error);

      await organizationController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update organization', async () => {
      mockReq.params.organizationId = 'org-1';
      mockReq.body = { name: 'Org 2' };
      const data = { id: 'org-1', name: 'Org 2' };
      mockOrganizationService.update.mockResolvedValue(data);

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.update).toHaveBeenCalledWith('org-1', {
        name: 'Org 2',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });

    it('should handle errors', async () => {
      mockReq.params.organizationId = 'org-1';
      mockReq.body = { name: 'Org 2' };
      const error = new Error('Service error');
      mockOrganizationService.update.mockRejectedValue(error);

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('should remove organization', async () => {
      mockReq.params.organizationId = 'org-1';
      const data = { id: 'org-1' };
      mockOrganizationService.remove.mockResolvedValue(data);

      await organizationController.remove(mockReq, mockRes, mockNext);

      expect(mockOrganizationService.remove).toHaveBeenCalledWith('org-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Deleted' });
    });

    it('should handle errors', async () => {
      mockReq.params.organizationId = 'org-1';
      const error = new Error('Service error');
      mockOrganizationService.remove.mockRejectedValue(error);

      await organizationController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
