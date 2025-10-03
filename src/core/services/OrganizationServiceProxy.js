class OrganizationServiceProxy {
  constructor({ organizationServiceReal, redisClient, logger }) {
    this.organizationService = organizationServiceReal; // Assign the real service
    this.redisClient = redisClient;
    this.logger = logger;
    this.cacheKeyPrefix = 'organization:';
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
    const data = await this.organizationService.getAll(payload);
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
    const data = await this.organizationService.getById(id);
    if (data) {
      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    // Invalidate cache for all organizations
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.organizationService.create(data);
  }

  async update(id, data) {
    // Invalidate cache for specific organization and all organizations
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.organizationService.update(id, data);
  }

  async remove(id) {
    // Invalidate cache for specific organization and all organizations
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.organizationService.remove(id);
  }
}

module.exports = OrganizationServiceProxy;
