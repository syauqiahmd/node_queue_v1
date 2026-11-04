const { createClient } = require('redis');

// Keys like auth:token:<jwt> contain credentials; never write them to logs verbatim.
const maskKey = (key) =>
  typeof key === 'string' ? key.replace(/^(auth:token:).+$/, '$1***') : key;

class RedisClient {
  constructor({ logger }) {
    this.logger = logger;
    this.logger.debug('[REDIS] New RedisClient instance created', { context: 'Redis Client' });
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD,
    });
    this.connected = false;

    this.client.on('error', (err) => {
      this.logger.error('[REDIS] Redis client error:', { context: 'Redis Client', error: err });
      this.connected = false;
    });

    this.client.on('connect', () => {
      this.logger.info('[REDIS] Redis client connecting...', { context: 'Redis Client' });
    });

    this.client.on('ready', () => {
      this.logger.info('[REDIS] Redis client ready', { context: 'Redis Client' });
      this.connected = true;
    });

    this.client.on('end', () => {
      this.logger.warn('[REDIS] Redis client connection ended', { context: 'Redis Client' });
      this.connected = false;
    });
  }

  async connect() {
    try {
      if (this.client.isOpen) {
        this.logger.info('[REDIS] Redis client already open', { context: 'Redis Client' });
        return;
      }
      await this.client.connect();
      this.logger.info('[REDIS] Redis client connected successfully', {
        context: 'Redis Client',
      });
      this.connected = true;
    } catch (error) {
      this.logger.error('[REDIS] Failed to connect to Redis', { context: 'Redis Client', error });
      this.connected = false;
      throw error; // Re-throw to propagate the error
    }
  }

  status() {
    return this.connected;
  }

  async ping() {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }
    return this.client.ping();
  }

  async disconnect() {
    if (!this.client.isOpen) {
      return;
    }
    try {
      await this.client.quit();
    } catch (error) {
      // QUIT fails when Redis already dropped the socket (e.g. Redis restarted during shutdown).
      this.logger.warn('[REDIS] Graceful quit failed, destroying client', {
        context: 'Redis Client',
        error,
      });
      this.client.destroy();
    }
  }

  async get(key) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted GET on disconnected client', { key: maskKey(key) });
      throw new Error('Redis client not connected');
    }
    return this.client.get(key);
  }

  async set(key, value, options) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted SET on disconnected client', { key: maskKey(key) });
      throw new Error('Redis client not connected');
    }
    return this.client.set(key, value, options);
  }

  async del(key) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted DEL on disconnected client', { key: maskKey(key) });
      throw new Error('Redis client not connected');
    }
    return this.client.del(key);
  }

  async scan(cursor, matchPattern, count) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted SCAN on disconnected client');
      throw new Error('Redis client not connected');
    }
    const result = await this.client.sendCommand([
      'SCAN',
      cursor.toString(),
      'MATCH',
      matchPattern,
      'COUNT',
      count.toString(),
    ]);
    const newCursor = parseInt(result[0], 10);
    const keys = result[1];
    return { cursor: newCursor, keys };
  }
}

module.exports = RedisClient;
