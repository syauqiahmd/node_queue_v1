const OrganizationController = require('@src/api/controllers/organizationController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('OrganizationController', () => {
  let organizationController;
  let organizationService;
  let businessException;
  let identityHelper;

  beforeEach(() => {
    organizationService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getAllWithService: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };
    identityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue('admin'),
    };

    organizationController = new OrganizationController({
      organizationService,
      businessException,
      identityHelper,
    });
  });

  describe('getAll', () => {
    const mockReq = {
      query: { page: 1, pageSize: 10, isActive: 'true' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return all organizations with pagination and filters', async () => {
      const mockOrganizations = [
        { id: 'org1', name: 'Org 1' },
        { id: 'org2', name: 'Org 2' },
      ];
      organizationService.getAll.mockResolvedValue({ totalRecord: 2, data: mockOrganizations });

      await organizationController.getAll(mockReq, mockRes, mockNext);

      expect(organizationService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        isActive: 'true',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { totalRecord: 2, data: mockOrganizations },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      organizationService.getAll.mockRejectedValue(mockError);

      await organizationController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getById', () => {
    const mockReq = {
      params: { organizationId: 'org123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return an organization by ID', async () => {
      const mockOrganization = { id: 'org123', name: 'Organization 123' };
      organizationService.getById.mockResolvedValue(mockOrganization);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(organizationService.getById).toHaveBeenCalledWith('org123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockOrganization });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if organization does not exist', async () => {
      organizationService.getById.mockResolvedValue(null);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(organizationService.getById).toHaveBeenCalledWith('org123');
      expect(businessException.NotFound).toHaveBeenCalledWith('Organization');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      organizationService.getById.mockRejectedValue(mockError);

      await organizationController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    const mockReq = {
      body: { name: 'New Org', fullName: 'New Organization' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should create a new organization', async () => {
      const newOrganization = { id: 'newOrgId', name: 'New Org' };
      organizationService.create.mockResolvedValue(newOrganization);

      await organizationController.create(mockReq, mockRes, mockNext);

      expect(organizationService.create).toHaveBeenCalledWith({
        name: 'New Org',
        fullName: 'New Organization',
        createdBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: newOrganization,
        message: 'Created',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      organizationService.create.mockRejectedValue(mockError);

      await organizationController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('update', () => {
    const mockReq = {
      params: { organizationId: 'org123' },
      body: { name: 'Updated Org' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should update an existing organization', async () => {
      const updatedOrganization = { id: 'org123', name: 'Updated Org' };
      organizationService.update.mockResolvedValue(updatedOrganization);

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(organizationService.update).toHaveBeenCalledWith('org123', {
        name: 'Updated Org',
        updatedBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedOrganization,
        message: 'Updated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      organizationService.update.mockRejectedValue(mockError);

      await organizationController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('remove', () => {
    const mockReq = {
      params: { organizationId: 'org123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should remove an organization', async () => {
      const removedOrganization = { id: 'org123', name: 'Removed Org' };
      organizationService.remove.mockResolvedValue(removedOrganization);

      await organizationController.remove(mockReq, mockRes, mockNext);

      expect(organizationService.remove).toHaveBeenCalledWith('org123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: removedOrganization,
        message: 'Deleted',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      organizationService.remove.mockRejectedValue(mockError);

      await organizationController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
