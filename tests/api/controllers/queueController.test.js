const QueueController = require('@src/api/controllers/queueController');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('QueueController', () => {
  let queueController;
  let queueService;
  let googleTextToSpeechService;
  let businessException;
  let queueResponse;

  beforeEach(() => {
    queueService = {
      getQueueListByServiceId: jest.fn(),
      getTotalQueueByServiceId: jest.fn(),
      getCurrentQueueDetailById: jest.fn(),
      updateQueueById: jest.fn(),
      callNextQueue: jest.fn(),
      getCallingQueue: jest.fn(),
      queueDetailById: jest.fn(),
    };
    googleTextToSpeechService = {
      generateSound: jest.fn(),
    };
    businessException = {
      NotFound: jest.fn((item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })),
      BadRequest: jest.fn((message) => new BusinessError({ message, statusCode: 400 })),
      unCalledQueue: jest.fn(() => new BusinessError({ code: 'UNAUTHORIZED', message: 'Queue not yet called', statusCode: 401 })),
    };
    queueResponse = {
      monitorCurrentQueue: jest.fn(),
    };

    queueController = new QueueController({
      queueService,
      googleTextToSpeechService,
      businessException,
      queueResponse,
    });
  });

  describe('getQueueListByServiceId', () => {
    const mockReq = {
      params: { serviceId: 'service123' },
      query: { counterId: 'counter123', status: 'in-progress' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return a list of queues by service ID with filters', async () => {
      const mockQueues = [{ id: 'queue1', serviceId: 'service123' }];
      queueService.getQueueListByServiceId.mockResolvedValue(mockQueues);

      await queueController.getQueueListByServiceId(mockReq, mockRes, mockNext);

      expect(queueService.getQueueListByServiceId).toHaveBeenCalledWith(
        'service123',
        { counterId: 'counter123', status: 'in-progress' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockQueues });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      queueService.getQueueListByServiceId.mockRejectedValue(mockError);

      await queueController.getQueueListByServiceId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getTotalQueueByServiceId', () => {
    const mockReq = {
      params: { serviceId: 'service123' },
      query: { status: 'in-progress' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return total queues by service ID with status', async () => {
      queueService.getTotalQueueByServiceId.mockResolvedValue(5);

      await queueController.getTotalQueueByServiceId(mockReq, mockRes, mockNext);

      expect(queueService.getTotalQueueByServiceId).toHaveBeenCalledWith('service123', 'in-progress');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { totalRecords: 5 } });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      queueService.getTotalQueueByServiceId.mockRejectedValue(mockError);

      await queueController.getTotalQueueByServiceId(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('actionQueueById', () => {
    const mockReq = {
      body: { action: 'resolve', queueId: 'queue123', counterId: 'counter123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should resolve a queue', async () => {
      const mockQueue = { id: 'queue123', isCall: true, isResolved: false };
      const updatedQueue = { ...mockQueue, isResolved: true };
      queueService.getCurrentQueueDetailById.mockResolvedValue(mockQueue);
      queueService.updateQueueById.mockResolvedValue(updatedQueue);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(queueService.getCurrentQueueDetailById).toHaveBeenCalledWith('queue123');
      expect(queueService.updateQueueById).toHaveBeenCalledWith('queue123', { isResolved: true });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedQueue });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should update latestAssigneeCounterId', async () => {
      const mockQueue = { id: 'queue123', isCall: true, isResolved: false };
      const updatedQueue = { ...mockQueue, latestAssigneeCounterId: 'counter123' };
      queueService.getCurrentQueueDetailById.mockResolvedValue(mockQueue);
      queueService.updateQueueById.mockResolvedValue(updatedQueue);

      const reqWithCounterId = { body: { action: 'update', queueId: 'queue123', counterId: 'counter123' } };
      await queueController.actionQueueById(reqWithCounterId, mockRes, mockNext);

      expect(queueService.getCurrentQueueDetailById).toHaveBeenCalledWith('queue123');
      expect(queueService.updateQueueById).toHaveBeenCalledWith('queue123', { latestAssigneeCounterId: 'counter123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: updatedQueue });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if queue does not exist', async () => {
      queueService.getCurrentQueueDetailById.mockResolvedValue(null);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(queueService.getCurrentQueueDetailById).toHaveBeenCalledWith('queue123');
      expect(businessException.NotFound).toHaveBeenCalledWith('queue');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should throw unCalledQueue error if queue is not called', async () => {
      const mockQueue = { id: 'queue123', isCall: false, isResolved: false };
      queueService.getCurrentQueueDetailById.mockResolvedValue(mockQueue);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(queueService.getCurrentQueueDetailById).toHaveBeenCalledWith('queue123');
      expect(businessException.unCalledQueue).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      queueService.getCurrentQueueDetailById.mockRejectedValue(mockError);

      await queueController.actionQueueById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('callNextQueue', () => {
    const mockReq = {
      body: { serviceId: 'service123', counterId: 'counter123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should call the next queue', async () => {
      const mockCalledQueue = { id: 'queue123', serviceId: 'service123', counterId: 'counter123' };
      queueService.callNextQueue.mockResolvedValue(mockCalledQueue);

      await queueController.callNextQueue(mockReq, mockRes, mockNext);

      expect(queueService.callNextQueue).toHaveBeenCalledWith({ serviceId: 'service123', counterId: 'counter123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockCalledQueue });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      queueService.callNextQueue.mockRejectedValue(mockError);

      await queueController.callNextQueue(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getCallingQueue', () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should return the current calling queue', async () => {
      const mockQueue = { id: 'queue123', status: 'calling' };
      queueService.getCallingQueue.mockResolvedValue(mockQueue);
      queueResponse.monitorCurrentQueue.mockReturnValue({ formattedData: true });

      await queueController.getCallingQueue(mockReq, mockRes, mockNext);

      expect(queueService.getCallingQueue).toHaveBeenCalled();
      expect(queueResponse.monitorCurrentQueue).toHaveBeenCalledWith(mockQueue);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { formattedData: true } });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('DB error');
      queueService.getCallingQueue.mockRejectedValue(mockError);

      await queueController.getCallingQueue(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('generateQueueCallingSound', () => {
    const mockReq = {
      params: { queueId: 'queue123' },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    it('should generate and return queue calling sound', async () => {
      const mockQueueDetail = {
        id: 'queue123',
        prefix: 'A',
        queueNumber: 101,
        latestAssigneeCounter: { counterNumber: 5 },
      };
      const mockSoundData = 'base64sounddata';
      queueService.queueDetailById.mockResolvedValue(mockQueueDetail);
      googleTextToSpeechService.generateSound.mockResolvedValue(mockSoundData);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(queueService.queueDetailById).toHaveBeenCalledWith('queue123');
      expect(googleTextToSpeechService.generateSound).toHaveBeenCalledWith(
        'Nomor antrian: A - 101; silahkan menuju, ke loket nomor, 5'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { data: mockQueueDetail, soundData: mockSoundData } });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFound error if queue does not exist', async () => {
      queueService.queueDetailById.mockResolvedValue(null);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(queueService.queueDetailById).toHaveBeenCalledWith('queue123');
      expect(businessException.NotFound).toHaveBeenCalledWith('Queue');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should throw BadRequest error if queue has no assigned counter', async () => {
      const mockQueueDetail = {
        id: 'queue123',
        prefix: 'A',
        queueNumber: 101,
        latestAssigneeCounter: null,
      };
      queueService.queueDetailById.mockResolvedValue(mockQueueDetail);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(queueService.queueDetailById).toHaveBeenCalledWith('queue123');
      expect(businessException.BadRequest).toHaveBeenCalledWith('Queue has not been assigned to a counter');
      expect(mockNext).toHaveBeenCalledWith(expect.any(BusinessError));
    });

    it('should call next with error if any exception occurs', async () => {
      const mockError = new Error('TTS error');
      queueService.queueDetailById.mockRejectedValue(mockError);

      await queueController.generateQueueCallingSound(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
