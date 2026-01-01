class CounterServiceProxy {
  constructor({ counterServiceReal, cacheService, logger }) {
    this.counterService = counterServiceReal; // Assign the real service
    this.cacheService = cacheService;
    this.logger = logger;
    this.cacheKeyPrefix = 'counter:';
    this.cacheDuration = 3600; // 1 hour
  }

  async getAll(payload) {
    const cacheKey = `${this.cacheKeyPrefix}all:${JSON.stringify(payload)}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.counterService.getAll(payload);
    await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    return data;
  }

  async getById(id) {
    const cacheKey = `${this.cacheKeyPrefix}id:${id}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.counterService.getById(id);
    if (data) {
      await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    const result = await this.counterService.create(data);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('service:');
    return result;
  }

  async update(id, data) {
    const result = await this.counterService.update(id, data);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('service:');
    return result;
  }

  async remove(id) {
    const result = await this.counterService.remove(id);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('service:');
    return result;
  }
}

module.exports = CounterServiceProxy;
