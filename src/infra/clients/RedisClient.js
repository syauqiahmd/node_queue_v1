const { createClient } = require('redis');

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
      if (!this.client.isOpen) {
        await this.client.connect();
        this.logger.info('[REDIS] Redis client connected successfully', { context: 'Redis Client' });
        this.connected = true;
      } else {
        this.logger.info('[REDIS] Redis client already open', { context: 'Redis Client' });
      }
    } catch (error) {
      this.logger.error('[REDIS] Failed to connect to Redis', { context: 'Redis Client', error });
      this.connected = false;
      throw error; // Re-throw to propagate the error
    }
  }

  status() {
    return this.connected;
  }

  async get(key) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted GET on disconnected client', { key });
      throw new Error('Redis client not connected');
    }
    return this.client.get(key);
  }

  async set(key, value, mode, duration) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted SET on disconnected client', { key });
      throw new Error('Redis client not connected');
    }
    return this.client.set(key, value, mode, duration);
  }

  async del(key) {
    if (!this.connected) {
      this.logger.warn('[REDIS] Attempted DEL on disconnected client', { key });
      throw new Error('Redis client not connected');
    }
    return this.client.del(key);
  }
}

module.exports = RedisClient;
