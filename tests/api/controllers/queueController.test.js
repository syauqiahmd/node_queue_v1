const QueueController = require('../../../src/api/controllers/queueController');

describe('QueueController', () => {
  let queueController;
  let mockQueueService;
  let mockGoogleTextToSpeechService;
  let mockBusinessException;
  let mockQueueResponse;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockQueueService = {
      getQueueListByServiceId: jest.fn(),
      getTotalQueueByServiceId: jest.fn(),
      updateQueueById: jest.fn(),
      recallTicket: jest.fn(),
      callNextQueue: jest.fn(),
      getCallingQueue: jest.fn(),
      queueDetailById: jest.fn(),
      prioritizeTicket: jest.fn(),
    };

    mockGoogleTextToSpeechService = {
      generateSound: jest.fn(),
    };

    mockBusinessException = {
      BadRequest: jest.fn((msg) => new Error(msg)),
      NotFound: jest.fn((msg) => new Error(`${msg} not found`)),
    };

    mockQueueResponse = {
      monitorCurrentQueue: jest.fn((data) => data),
    };

    mockReq = {
      params: {},
      query: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    queueController = new QueueController({
      queueService: mockQueueService,
      googleTextToSpeechService: mockGoogleTextToSpeechService,
      businessException: mockBusinessException,
      queueResponse: mockQueueResponse,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueueListByServiceId', () => {
    it('should return queue list', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.query = { counterId: 'c-1', status: 'WAITING' };
      const data = [{ id: 1 }];
      mockQueueService.getQueueListByServiceId.mockResolvedValue(data);

      await queueController.getQueueListByServiceId(mockReq, mockRes, mockNext);

      expect(mockQueueService.getQueueListByServiceId).toHaveBeenCalledWith('s-1', {
        counterId: 'c-1',
        status: 'WAITING',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockQueueService.getQueueListByServiceId.mockRejectedValue(error);

      await queueController.getQueueListByServiceId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getTotalQueueByServiceId', () => {
    it('should return total queue count', async () => {
      mockReq.params.serviceId = 's-1';
      mockReq.query = { status: 'WAITING' };
      const count = 5;
      mockQueueService.getTotalQueueByServiceId.mockResolvedValue(count);

      await queueController.getTotalQueueByServiceId(mockReq, mockRes, mockNext);

      expect(mockQueueService.getTotalQueueByServiceId).toHaveBeenCalledWith('s-1', 'WAITING');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { totalRecords: count } });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockQueueService.getTotalQueueByServiceId.mockRejectedValue(error);

      await queueController.getTotalQueueByServiceId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('actionQueueById', () => {
    it('should resolve ticket if action is resolve', async () => {
      mockReq.body = { action: 'resolve', queueId: 'q-1' };
      const updatedTicket = { id: 'q-1', isResolved: true };
      mockQueueService.updateQueueById.mockResolvedValue(updatedTicket);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(mockQueueService.updateQueueById).toHaveBeenCalledWith('q-1', { isResolved: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedTicket, message: 'Ticket resolved' });
    });

    it('should recall ticket if action is retry', async () => {
      mockReq.body = { action: 'retry', queueId: 'q-1', counterId: 'c-1' };
      const recalledTicket = { id: 'q-1' };
      mockQueueService.recallTicket.mockResolvedValue(recalledTicket);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(mockQueueService.recallTicket).toHaveBeenCalledWith('q-1', 'c-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: recalledTicket, message: 'Ticket recalled' });
    });

    it('should throw BadRequest for invalid action', async () => {
      mockReq.body = { action: 'invalid' };

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Invalid action specified');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle generic errors', async () => {
      const error = new Error('Test error');
      mockReq.body = { action: 'resolve', queueId: 'q-1' };
      mockQueueService.updateQueueById.mockRejectedValue(error);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('callNextQueue', () => {
    it('should call next queue', async () => {
      mockReq.body = { serviceId: 's-1', counterId: 'c-1' };
      const data = { id: 'q-1' };
      mockQueueService.callNextQueue.mockResolvedValue(data);

      await queueController.callNextQueue(mockReq, mockRes, mockNext);

      expect(mockQueueService.callNextQueue).toHaveBeenCalledWith({ serviceId: 's-1', counterId: 'c-1' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockQueueService.callNextQueue.mockRejectedValue(error);

      await queueController.callNextQueue(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCallingQueue', () => {
    it('should return calling queue', async () => {
      const data = [{ id: 'q-1' }];
      mockQueueService.getCallingQueue.mockResolvedValue(data);

      await queueController.getCallingQueue(mockReq, mockRes, mockNext);

      expect(mockQueueService.getCallingQueue).toHaveBeenCalled();
      expect(mockQueueResponse.monitorCurrentQueue).toHaveBeenCalledWith(data);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockQueueService.getCallingQueue.mockRejectedValue(error);

      await queueController.getCallingQueue(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('generateQueueCallingSound', () => {
    it('should generate sound for queue', async () => {
      mockReq.params.queueId = 'q-1';
      const queueDetail = {
        id: 'q-1',
        prefix: 'A',
        queueNumber: '001',
        latestAssigneeCounter: { counterNumber: '1' },
      };
      const soundUrl = 'https://sound.url';

      mockQueueService.queueDetailById.mockResolvedValue(queueDetail);
      mockGoogleTextToSpeechService.generateSound.mockResolvedValue(soundUrl);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(mockQueueService.queueDetailById).toHaveBeenCalledWith('q-1');
      expect(mockGoogleTextToSpeechService.generateSound).toHaveBeenCalledWith(
        'Nomor antrian: A - 001; silahkan menuju, ke loket nomor, 1'
      );
      expect(mockQueueService.updateQueueById).toHaveBeenCalledWith('q-1', { soundUrl });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { queueDetail, soundUrl },
      });
    });

    it('should throw NotFound if queue not found', async () => {
      mockReq.params.queueId = 'q-1';
      mockQueueService.queueDetailById.mockResolvedValue(null);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(mockBusinessException.NotFound).toHaveBeenCalledWith('Queue');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw BadRequest if not assigned to counter', async () => {
      mockReq.params.queueId = 'q-1';
      mockQueueService.queueDetailById.mockResolvedValue({ id: 'q-1' }); // No latestAssigneeCounter

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(mockBusinessException.BadRequest).toHaveBeenCalledWith('Queue has not been assigned to a counter');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle generic errors', async () => {
      const error = new Error('Test error');
      mockReq.params.queueId = 'q-1';
      mockQueueService.queueDetailById.mockRejectedValue(error);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('prioritizeTicket', () => {
    it('should prioritize ticket', async () => {
      mockReq.params.queueId = 'q-1';
      const updatedTicket = { id: 'q-1', isPrioritized: true };
      mockQueueService.prioritizeTicket.mockResolvedValue(updatedTicket);

      await queueController.prioritizeTicket(mockReq, mockRes, mockNext);

      expect(mockQueueService.prioritizeTicket).toHaveBeenCalledWith('q-1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedTicket, message: 'Ticket prioritized' });
    });

    it('should handle errors', async () => {
      const error = new Error('Test error');
      mockQueueService.prioritizeTicket.mockRejectedValue(error);

      await queueController.prioritizeTicket(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
