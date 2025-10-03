class CounterServiceProxy {
  constructor({ counterServiceReal, redisClient, logger }) {
    this.counterService = counterServiceReal; // Assign the real service
    this.redisClient = redisClient;
    this.logger = logger;
    this.cacheKeyPrefix = 'counter:';
    this.cacheDuration = 3600; // 1 hour
  }

  async getAll(payload) {
    const cacheKey = `${this.cacheKeyPrefix}all:${JSON.stringify(payload)}`;
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.counterService.getAll(payload);
    await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    return data;
  }

  async getById(id) {
    const cacheKey = `${this.cacheKeyPrefix}id:${id}`;
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.counterService.getById(id);
    if (data) {
      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.counterService.create(data);
  }

  async update(id, data) {
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.counterService.update(id, data);
  }

  async remove(id) {
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.counterService.remove(id);
  }
}

module.exports = CounterServiceProxy;
