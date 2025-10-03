const ServiceController = require('@src/api/controllers/serviceController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('ServiceController', () => {
  let serviceController;
  let serviceService;
  let businessException;

  beforeEach(() => {
    serviceService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn((item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })),
    };

    serviceController = new ServiceController({
      serviceService,
      businessException,
    });
  });

  describe('publicServiceList', () => {
    const mockReq = {
      query: {},
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return a list of public services', async () => {
      const mockServices = [
        {
          id: 'service1',
          name: 'Service 1',
          prefix: 'S1',
          organization: { id: 'org1', name: 'Org 1', fullName: 'Organization 1' },
        },
      ];
      serviceService.getAll.mockResolvedValue({ totalRecord: 1, data: mockServices });

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(serviceService.getAll).toHaveBeenCalledWith({ isActive: 'true' }, false);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalRecord: 1,
          data: [
            {
              id: 'service1',
              name: 'Service 1',
              prefix: 'S1',
              organization: { id: 'org1', name: 'Org 1', fullName: 'Organization 1' },
            },
          ],
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('Something went wrong');
      serviceService.getAll.mockRejectedValue(mockError);

      await serviceController.publicServiceList(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getAll', () => {
    const mockReq = {
      query: { page: 1, pageSize: 10, status: 'active' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return all services with pagination and filters', async () => {
      const mockServices = [
        { id: 'service1', name: 'Service 1' },
        { id: 'service2', name: 'Service 2' },
      ];
      serviceService.getAll.mockResolvedValue({ totalRecord: 2, data: mockServices });

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(serviceService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        status: 'active',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { totalRecord: 2, data: mockServices },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      serviceService.getAll.mockRejectedValue(mockError);

      await serviceController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getById', () => {
    const mockReq = {
      params: { serviceId: 'service123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return a service by ID', async () => {
      const mockService = { id: 'service123', name: 'Service 123' };
      serviceService.getById.mockResolvedValue(mockService);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(serviceService.getById).toHaveBeenCalledWith('service123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockService });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if service does not exist', async () => {
      serviceService.getById.mockResolvedValue(null);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(serviceService.getById).toHaveBeenCalledWith('service123');
      expect(businessException.NotFound).toHaveBeenCalledWith('Service');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      serviceService.getById.mockRejectedValue(mockError);

      await serviceController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    const mockReq = {
      body: { name: 'New Service', prefix: 'NS' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should create a new service', async () => {
      const newService = { id: 'newServiceId', name: 'New Service' };
      serviceService.create.mockResolvedValue(newService);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(serviceService.create).toHaveBeenCalledWith({
        name: 'New Service',
        prefix: 'NS',
        createdBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: newService, message: 'Created' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      serviceService.create.mockRejectedValue(mockError);

      await serviceController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('update', () => {
    const mockReq = {
      params: { serviceId: 'service123' },
      body: { name: 'Updated Service' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should update an existing service', async () => {
      const updatedService = { id: 'service123', name: 'Updated Service' };
      serviceService.update.mockResolvedValue(updatedService);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(serviceService.update).toHaveBeenCalledWith('service123', { name: 'Updated Service' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedService, message: 'Updated' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      serviceService.update.mockRejectedValue(mockError);

      await serviceController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('remove', () => {
    const mockReq = {
      params: { serviceId: 'service123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should remove a service', async () => {
      const removedService = { id: 'service123', name: 'Removed Service' };
      serviceService.remove.mockResolvedValue(removedService);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(serviceService.remove).toHaveBeenCalledWith('service123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: removedService, message: 'Deleted' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      serviceService.remove.mockRejectedValue(mockError);

      await serviceController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
