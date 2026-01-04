const CounterController = require('../../../src/api/controllers/counterController');

describe('CounterController', () => {
  let counterController;
  let mockCounterService;
  let mockBusinessException;
  let mockIdentityHelper;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockCounterService = {
      getAll: jest.fn(),
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

    counterController = new CounterController({
      counterService: mockCounterService,
      businessException: mockBusinessException,
      identityHelper: mockIdentityHelper,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return list of counters', async () => {
      mockReq.query = { page: '1', pageSize: '10' };
      const data = [{ id: 1, counterNumber: 'C1' }];
      mockCounterService.getAll.mockResolvedValue(data);

      await counterController.getAll(mockReq, mockRes, mockNext);

      expect(mockCounterService.getAll).toHaveBeenCalledWith({
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
      mockCounterService.getAll.mockRejectedValue(error);

      await counterController.getAll(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should return counter by id', async () => {
      mockReq.params.counterId = 'c-1';
      const data = { id: 'c-1', counterNumber: 'C1' };
      mockCounterService.getById.mockResolvedValue(data);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(mockCounterService.getById).toHaveBeenCalledWith('c-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should throw NotFound if counter not found', async () => {
      mockReq.params.counterId = 'c-1';
      mockCounterService.getById.mockResolvedValue(null);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Counter');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors', async () => {
      mockReq.params.counterId = 'c-1';
      const error = new Error('Service error');
      mockCounterService.getById.mockRejectedValue(error);

      await counterController.getById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create counter', async () => {
      mockReq.body = { counterNumber: 'C1' };
      const data = { id: 1, counterNumber: 'C1' };
      mockCounterService.create.mockResolvedValue(data);

      await counterController.create(mockReq, mockRes, mockNext);

      expect(mockCounterService.create).toHaveBeenCalledWith({
        counterNumber: 'C1',
        createdBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Created' });
    });

    it('should handle errors', async () => {
      mockReq.body = { counterNumber: 'C1' };
      const error = new Error('Service error');
      mockCounterService.create.mockRejectedValue(error);

      await counterController.create(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update counter', async () => {
      mockReq.params.counterId = 'c-1';
      mockReq.body = { counterNumber: 'C2' };
      const data = { id: 'c-1', counterNumber: 'C2' };
      mockCounterService.update.mockResolvedValue(data);

      await counterController.update(mockReq, mockRes, mockNext);

      expect(mockCounterService.update).toHaveBeenCalledWith('c-1', {
        counterNumber: 'C2',
        updatedBy: 1,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Updated' });
    });

    it('should handle errors', async () => {
      mockReq.params.counterId = 'c-1';
      mockReq.body = { counterNumber: 'C2' };
      const error = new Error('Service error');
      mockCounterService.update.mockRejectedValue(error);

      await counterController.update(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('remove', () => {
    it('should remove counter', async () => {
      mockReq.params.counterId = 'c-1';
      const data = { id: 'c-1' };
      mockCounterService.remove.mockResolvedValue(data);

      await counterController.remove(mockReq, mockRes, mockNext);

      expect(mockCounterService.remove).toHaveBeenCalledWith('c-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data, message: 'Deleted' });
    });

    it('should handle errors', async () => {
      mockReq.params.counterId = 'c-1';
      const error = new Error('Service error');
      mockCounterService.remove.mockRejectedValue(error);

      await counterController.remove(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
