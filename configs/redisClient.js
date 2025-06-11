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

module.exports = redis;
