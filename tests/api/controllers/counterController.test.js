const CounterController = require('@src/api/controllers/counterController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('CounterController', () => {
  let counterController;
  let counterService;
  let businessException;
  let identityHelper;

  beforeEach(() => {
    counterService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };
    identityHelper = {
      getCurrentUserId: jest.fn().mockReturnValue('admin'),
    };

    counterController = new CounterController({
      counterService,
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

    it('should return all counters with pagination and filters', async () => {
      const mockCounters = [
        { id: 'counter1', name: 'Counter 1' },
        { id: 'counter2', name: 'Counter 2' },
      ];
      counterService.getAll.mockResolvedValue({ totalRecord: 2, data: mockCounters });

      await counterController.getAll(mockReq, mockRes, mockNext);

      expect(counterService.getAll).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        isActive: 'true',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { totalRecord: 2, data: mockCounters },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      counterService.getAll.mockRejectedValue(mockError);

      await counterController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getById', () => {
    const mockReq = {
      params: { counterId: 'counter123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return a counter by ID', async () => {
      const mockCounter = { id: 'counter123', name: 'Counter 123' };
      counterService.getById.mockResolvedValue(mockCounter);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(counterService.getById).toHaveBeenCalledWith('counter123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCounter });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if counter does not exist', async () => {
      counterService.getById.mockResolvedValue(null);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(counterService.getById).toHaveBeenCalledWith('counter123');
      expect(businessException.NotFound).toHaveBeenCalledWith('Counter');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      counterService.getById.mockRejectedValue(mockError);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('create', () => {
    const mockReq = {
      body: { name: 'New Counter', serviceId: 'service123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should create a new counter', async () => {
      const newCounter = { id: 'newCounterId', name: 'New Counter' };
      counterService.create.mockResolvedValue(newCounter);

      await counterController.create(mockReq, mockRes, mockNext);

      expect(counterService.create).toHaveBeenCalledWith({
        name: 'New Counter',
        serviceId: 'service123',
        createdBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: newCounter,
        message: 'Created',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      counterService.create.mockRejectedValue(mockError);

      await counterController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('update', () => {
    const mockReq = {
      params: { counterId: 'counter123' },
      body: { name: 'Updated Counter' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should update an existing counter', async () => {
      const updatedCounter = { id: 'counter123', name: 'Updated Counter' };
      counterService.update.mockResolvedValue(updatedCounter);

      await counterController.update(mockReq, mockRes, mockNext);

      expect(counterService.update).toHaveBeenCalledWith('counter123', {
        name: 'Updated Counter',
        updatedBy: 'admin',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedCounter,
        message: 'Updated',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      counterService.update.mockRejectedValue(mockError);

      await counterController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('remove', () => {
    const mockReq = {
      params: { counterId: 'counter123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should remove a counter', async () => {
      const removedCounter = { id: 'counter123', name: 'Removed Counter' };
      counterService.remove.mockResolvedValue(removedCounter);

      await counterController.remove(mockReq, mockRes, mockNext);

      expect(counterService.remove).toHaveBeenCalledWith('counter123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: removedCounter,
        message: 'Deleted',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      counterService.remove.mockRejectedValue(mockError);

      await counterController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
