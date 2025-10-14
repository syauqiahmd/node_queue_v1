class OrganizationServiceProxy {
  constructor({ organizationServiceReal, cacheService, logger }) {
    this.organizationService = organizationServiceReal; // Assign the real service
    this.cacheService = cacheService;
    this.logger = logger;
    this.cacheKeyPrefix = 'organization:';
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
    const data = await this.organizationService.getAll(payload);
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
    const data = await this.organizationService.getById(id);
    if (data) {
      await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    }
    return data;
  }

  async getPublicList() {
    const cacheKey = `${this.cacheKeyPrefix}publicList`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.organizationService.getPublicList();
    if (data) {
      await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    }
    return data;
  }

  async getAllWithService(payload) {
    const cacheKey = `${this.cacheKeyPrefix}allWithService:${JSON.stringify(payload)}`;
    const cachedData = await this.cacheService.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for ${cacheKey}. Fetching from real service.`);
    const data = await this.organizationService.getAllWithService(payload);
    await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    return data;
  }

  async create(data) {
    const result = await this.organizationService.create(data);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }

  async update(id, data) {
    const result = await this.organizationService.update(id, data);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }

  async remove(id) {
    const result = await this.organizationService.remove(id);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }
}

module.exports = OrganizationServiceProxy;
