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

  // Organization data is embedded in other cached entries: services (kiosk/monitor lists),
  // counters (service.organization) and users (their organization).
  async invalidateAfterWrite(id = null) {
    if (id) {
      await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    }
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    await this.cacheService.invalidate('service:');
    await this.cacheService.invalidate('counter:');
    await this.cacheService.invalidate('user:');
  }

  async create(data) {
    const result = await this.organizationService.create(data);
    await this.invalidateAfterWrite();
    return result;
  }

  async update(id, data) {
    const result = await this.organizationService.update(id, data);
    await this.invalidateAfterWrite(id);
    return result;
  }

  async uploadLogo(id, buffer, updatedBy) {
    const result = await this.organizationService.uploadLogo(id, buffer, updatedBy);
    await this.invalidateAfterWrite(id);
    return result;
  }

  async remove(id) {
    const result = await this.organizationService.remove(id);
    await this.invalidateAfterWrite(id);
    return result;
  }
}

module.exports = OrganizationServiceProxy;
