const HealthCheck = require('../../../src/infra/utils/healthCheck');

describe('HealthCheck', () => {
  let healthCheck;
  let mockPrismaClient;
  let mockRedisClient;
  let mockS3Client;
  let mockLogger;

  beforeEach(() => {
    mockPrismaClient = {
      $queryRaw: jest.fn(),
      $disconnect: jest.fn(),
    };

    mockRedisClient = {
      status: jest.fn(),
    };

    mockS3Client = {
      s3: {
        listBuckets: jest.fn().mockReturnValue({
          promise: jest.fn(),
        }),
      },
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    // Prevent process.exit from terminating the test runner
    jest.spyOn(process, 'exit').mockImplementation(() => {});

    healthCheck = new HealthCheck({
      prismaClient: mockPrismaClient,
      redisClient: mockRedisClient,
      s3Client: mockS3Client,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDbConnection', () => {
    it('should return true if DB connection is successful', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([1]);

      const result = await healthCheck.checkDbConnection();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database connected successfully',
        expect.anything()
      );
    });

    it('should return false if DB connection fails', async () => {
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('DB Error'));

      const result = await healthCheck.checkDbConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database connection failed',
        expect.anything()
      );
    });
  });

  describe('checkRedisConnection', () => {
    it('should return true if Redis status is okay', async () => {
      mockRedisClient.status.mockReturnValue(true);

      const result = await healthCheck.checkRedisConnection();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Redis connected successfully',
        expect.anything()
      );
    });

    it('should return false if Redis status is not okay', async () => {
      mockRedisClient.status.mockReturnValue(false);

      const result = await healthCheck.checkRedisConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Redis connection failed: Client not connected after startup.',
        expect.anything()
      );
    });

    it('should return false if Redis check throws error', async () => {
      mockRedisClient.status.mockImplementation(() => {
        throw new Error('Redis Error');
      });

      const result = await healthCheck.checkRedisConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Redis connection failed', expect.anything());
    });
  });

  describe('checkS3Connection', () => {
    it('should return true if S3 listBuckets is successful', async () => {
      mockS3Client.s3.listBuckets().promise.mockResolvedValue({});

      const result = await healthCheck.checkS3Connection();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('S3 connected successfully', expect.anything());
    });

    it('should return false if S3 listBuckets fails', async () => {
      mockS3Client.s3.listBuckets().promise.mockRejectedValue(new Error('S3 Error'));

      const result = await healthCheck.checkS3Connection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('S3 connection failed', expect.anything());
    });
  });

  describe('runChecks', () => {
    it('should return true if all checks pass', async () => {
      jest.spyOn(healthCheck, 'checkDbConnection').mockResolvedValue(true);
      jest.spyOn(healthCheck, 'checkRedisConnection').mockResolvedValue(true);
      jest.spyOn(healthCheck, 'checkS3Connection').mockResolvedValue(true);

      const result = await healthCheck.runChecks();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'All critical infrastructure services are connected.',
        expect.anything()
      );
    });

    it('should exit process if any check fails', async () => {
      jest.spyOn(healthCheck, 'checkDbConnection').mockResolvedValue(false);
      jest.spyOn(healthCheck, 'checkRedisConnection').mockResolvedValue(true);
      jest.spyOn(healthCheck, 'checkS3Connection').mockResolvedValue(true);

      await healthCheck.runChecks();

      expect(process.exit).toHaveBeenCalledWith(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'One or more critical infrastructure services failed to connect. Exiting application.',
        expect.anything()
      );
    });
  });
});

describe('HealthCheck.getStatus', () => {
  let healthCheck;
  let mockPrismaClient;
  let mockRedisClient;
  let mockLogger;

  beforeEach(() => {
    mockPrismaClient = { $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]) };
    mockRedisClient = { ping: jest.fn().mockResolvedValue('PONG') };
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    jest.spyOn(process, 'exit').mockImplementation(() => {});

    healthCheck = new HealthCheck({
      prismaClient: mockPrismaClient,
      redisClient: mockRedisClient,
      s3Client: {},
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reports healthy when database and redis respond', async () => {
    await expect(healthCheck.getStatus()).resolves.toEqual({
      healthy: true,
      checks: { database: 'up', redis: 'up' },
    });
  });

  it('reports a failing dependency as down without exiting', async () => {
    mockRedisClient.ping.mockRejectedValue(new Error('Redis client not connected'));

    await expect(healthCheck.getStatus()).resolves.toEqual({
      healthy: false,
      checks: { database: 'up', redis: 'down' },
    });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Health check failed: redis',
      expect.objectContaining({ error: expect.any(Error) })
    );
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('reports a dependency that hangs past the timeout as down', async () => {
    mockPrismaClient.$queryRaw.mockReturnValue(new Promise(() => {}));

    await expect(healthCheck.getStatus(20)).resolves.toEqual({
      healthy: false,
      checks: { database: 'down', redis: 'up' },
    });
  });
});
