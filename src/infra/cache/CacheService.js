class CacheService {
  constructor({ redisClient, logger }) {
    this.redisClient = redisClient;
    this.logger = logger;
  }

  async get(key) {
    return this.redisClient.get(key);
  }

  async set(key, value, duration) {
    return this.redisClient.set(key, value, { EX: duration });
  }

  async del(key) {
    return this.redisClient.del(key);
  }

  async deleteKeysByPattern(pattern) {
    let cursor = 0;
    do {
      const reply = await this.redisClient.scan(cursor, pattern, 100);
      cursor = reply.cursor;
      const keys = reply.keys;
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } while (cursor !== 0);
  }

  async invalidate(prefix) {
    this.logger.info(`Invalidating cache for prefix: ${prefix}`);
    await this.deleteKeysByPattern(`${prefix}*`);
  }
}

module.exports = CacheService;
