class ServiceServiceProxy {
  constructor({ serviceServiceReal, cacheService, logger }) {
    this.serviceService = serviceServiceReal; // Assign the real service
    this.cacheService = cacheService;
    this.logger = logger;
    this.cacheKeyPrefix = 'service:';
    this.cacheDuration = 3600; // 1 hour
  }

  async getAll(payload, pagination = true) {
    const cacheKey = `${this.cacheKeyPrefix}all:${JSON.stringify(payload)}:${pagination}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.serviceService.getAll(payload, pagination);
    await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    return data;
  }
  async publicGetAll(payload, pagination = true) {
    const cacheKey = `${this.cacheKeyPrefix}allPublic:${JSON.stringify(payload)}:${pagination}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.serviceService.publicGetAll(payload, pagination);
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
    const data = await this.serviceService.getById(id);
    if (data) {
      await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    const result = await this.serviceService.create(data);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('organization:');
    return result;
  }

  async update(id, data) {
    const result = await this.serviceService.update(id, data);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('organization:');
    return result;
  }

  async remove(id) {
    const result = await this.serviceService.remove(id);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('organization:');
    return result;
  }
}

module.exports = ServiceServiceProxy;
