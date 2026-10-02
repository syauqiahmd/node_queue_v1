jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    isOpen: false,
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn(),
  })),
}));

const RedisClient = require('../../../src/infra/clients/RedisClient');

describe('RedisClient', () => {
  let redisClient;
  let mockLogger;

  beforeEach(() => {
    mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    redisClient = new RedisClient({ logger: mockLogger });
  });

  it('masks session tokens in auth keys when logging', async () => {
    await expect(redisClient.get('auth:token:eyJhbGciOi.secret.sig')).rejects.toThrow(
      'Redis client not connected'
    );

    expect(mockLogger.warn).toHaveBeenCalledWith('[REDIS] Attempted GET on disconnected client', {
      key: 'auth:token:***',
    });
  });

  it('logs non-sensitive keys as-is', async () => {
    await expect(redisClient.del('cache:services:1')).rejects.toThrow();

    expect(mockLogger.warn).toHaveBeenCalledWith('[REDIS] Attempted DEL on disconnected client', {
      key: 'cache:services:1',
    });
  });

  it('ping rejects when not connected and resolves when connected', async () => {
    await expect(redisClient.ping()).rejects.toThrow('Redis client not connected');

    redisClient.connected = true;
    await expect(redisClient.ping()).resolves.toBe('PONG');
  });

  it('disconnect only quits an open client', async () => {
    await redisClient.disconnect();
    expect(redisClient.client.quit).not.toHaveBeenCalled();

    redisClient.client.isOpen = true;
    await redisClient.disconnect();
    expect(redisClient.client.quit).toHaveBeenCalled();
  });
});
