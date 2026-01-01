const GoogleTextToSpeechServiceProxy = require('../../../src/core/services/GoogleTextToSpeechServiceProxy');

describe('GoogleTextToSpeechServiceProxy', () => {
  let googleTextToSpeechServiceProxy;
  let mockGoogleTextToSpeechServiceReal;
  let mockRedisClient;
  let mockLogger;

  beforeEach(() => {
    mockGoogleTextToSpeechServiceReal = {
      generateSound: jest.fn(),
    };

    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
    };

    googleTextToSpeechServiceProxy = new GoogleTextToSpeechServiceProxy({
      googleTextToSpeechServiceReal: mockGoogleTextToSpeechServiceReal,
      redisClient: mockRedisClient,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSound', () => {
    it('should return cached data if available', async () => {
      const text = 'hello';
      const queueId = 'ticket-1';
      const cachedUrl = 'http://sound.url';
      const cacheKey = `tts:${queueId}`;
      mockRedisClient.get.mockResolvedValue(cachedUrl);

      const result = await googleTextToSpeechServiceProxy.generateSound(text, queueId);

      expect(mockRedisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache hit'));
      expect(mockGoogleTextToSpeechServiceReal.generateSound).not.toHaveBeenCalled();
      expect(result).toBe(cachedUrl);
    });

    it('should fetch from real service if cache miss', async () => {
      const text = 'hello';
      const queueId = 'ticket-1';
      const realUrl = 'http://sound.url';
      const cacheKey = `tts:${queueId}`;
      mockRedisClient.get.mockResolvedValue(null);
      mockGoogleTextToSpeechServiceReal.generateSound.mockResolvedValue(realUrl);

      const result = await googleTextToSpeechServiceProxy.generateSound(text, queueId);

      expect(mockRedisClient.get).toHaveBeenCalledWith(cacheKey);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Cache miss'));
      expect(mockGoogleTextToSpeechServiceReal.generateSound).toHaveBeenCalledWith(text, queueId);
      expect(mockRedisClient.set).toHaveBeenCalledWith(cacheKey, realUrl, { EX: 3600 });
      expect(result).toBe(realUrl);
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache for queueId', async () => {
      const queueId = 'ticket-1';
      const cacheKey = `tts:${queueId}`;

      await googleTextToSpeechServiceProxy.invalidateCache(queueId);

      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Invalidating TTS cache'));
      expect(mockRedisClient.del).toHaveBeenCalledWith(cacheKey);
    });
  });
});
