const { createClient } = require('redis');
const logger = require('../utils/logger');

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD,
});

redis.on('error', (err) => {
  logger.error('[REDIS] Redis client error:', { context: 'Redis Client', error: err });
});

const initRedis = async () => {
  try {
    await redis.connect();
    logger.info('[REDIS] Redis client connected successfully', { context: 'Redis Client' });
  } catch (error) {
    logger.error('[REDIS] Failed to connect to Redis', { context: 'Redis Client', error });
  }
};

module.exports = { redis, initRedis };
