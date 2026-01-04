const CronController = require('../../../src/api/controllers/cronController');
const CRON_TYPES = require('../../../src/core/constants/cronTypes');

describe('CronController', () => {
  let cronController;
  let mockQueueService;
  let mockResponseFormatter;
  let mockLogger;
  let mockBusinessException;
  let mockReq;
  let mockRes;
  let mockNext;
  const validMasterPassword = 'validPassword';

  beforeEach(() => {
    process.env.MASTER_PASSWORD = validMasterPassword;

    mockQueueService = {
      generateDailyStats: jest.fn(),
      cleanUpTicket: jest.fn(),
      cleanUpS3Files: jest.fn(),
    };

    mockResponseFormatter = {
      success: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockBusinessException = {
      Forbidden: jest.fn((msg) => new Error(msg)),
    };

    cronController = new CronController({
      queueService: mockQueueService,
      responseFormatter: mockResponseFormatter,
      logger: mockLogger,
      businessException: mockBusinessException,
    });

    mockReq = {
      body: {
        masterPassword: validMasterPassword,
      },
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    delete process.env.MASTER_PASSWORD;
  });

  describe('triggerCron', () => {
    it('should trigger PRE_CALCULATE cron', async () => {
      const date = '2023-10-27';
      mockReq.body = {
        date,
        cronType: CRON_TYPES.PRE_CALCULATE,
        masterPassword: validMasterPassword,
      };
      const expectedResult = { count: 5 };
      mockQueueService.generateDailyStats.mockResolvedValue(expectedResult);

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockQueueService.generateDailyStats).toHaveBeenCalledWith(date);
      expect(mockResponseFormatter.success).toHaveBeenCalledWith(
        mockRes,
        expectedResult,
        'Cron triggered successfully'
      );
    });

    it('should throw Forbidden error if master password is invalid', async () => {
      mockReq.body = {
        date: '2023-10-27',
        cronType: CRON_TYPES.PRE_CALCULATE,
        masterPassword: 'wrongPassword',
      };

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockBusinessException.Forbidden).toHaveBeenCalledWith('Invalid master password');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should trigger HOUSEKEEPING_QUEUE_DATA cron', async () => {
      const date = '2023-10-27';
      mockReq.body = {
        date,
        cronType: CRON_TYPES.HOUSEKEEPING_QUEUE_DATA,
        masterPassword: validMasterPassword,
      };
      const expectedResult = { count: 10 };
      mockQueueService.cleanUpTicket.mockResolvedValue(expectedResult);

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockQueueService.cleanUpTicket).toHaveBeenCalledWith(new Date(date));
      expect(mockResponseFormatter.success).toHaveBeenCalledWith(
        mockRes,
        expectedResult,
        'Cron triggered successfully'
      );
    });

    it('should trigger HOUSEKEEPING_S3_FILES cron', async () => {
      const date = '2023-10-27';
      mockReq.body = {
        date,
        cronType: CRON_TYPES.HOUSEKEEPING_S3_FILES,
        masterPassword: validMasterPassword,
      };
      const expectedResult = { count: 3 };
      mockQueueService.cleanUpS3Files.mockResolvedValue(expectedResult);

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockQueueService.cleanUpS3Files).toHaveBeenCalledWith('sound-generated/2023-10-27');
      expect(mockResponseFormatter.success).toHaveBeenCalledWith(
        mockRes,
        expectedResult,
        'Cron triggered successfully'
      );
    });

    it('should handle invalid cron type', async () => {
      mockReq.body = {
        date: '2023-10-27',
        cronType: 'INVALID_TYPE',
        masterPassword: validMasterPassword,
      };

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Invalid cron type');
    });

    it('should handle service errors', async () => {
      mockReq.body = {
        date: '2023-10-27',
        cronType: CRON_TYPES.PRE_CALCULATE,
        masterPassword: validMasterPassword,
      };
      const error = new Error('Service error');
      mockQueueService.generateDailyStats.mockRejectedValue(error);

      await cronController.triggerCron(mockReq, mockRes, mockNext);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
