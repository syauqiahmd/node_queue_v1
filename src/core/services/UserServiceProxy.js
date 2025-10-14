class UserServiceProxy {
  constructor({ userServiceReal, cacheService, logger }) {
    this.userService = userServiceReal; // Assign the real service
    this.cacheService = cacheService;
    this.logger = logger;
    this.cacheKeyPrefix = 'user:';
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
    const data = await this.userService.getAll(payload);
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
    const data = await this.userService.getById(id);
    if (data) {
      await this.cacheService.set(cacheKey, JSON.stringify(data), this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    const result = await this.userService.create(data);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }

  async update(id, data) {
    const result = await this.userService.update(id, data);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }

  async remove(id) {
    const result = await this.userService.remove(id);
    await this.cacheService.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.cacheService.invalidate(this.cacheKeyPrefix);
    return result;
  }

  async userDetailByUsername(userName) {
    // This method is specific to UserService and might not be part of a generic interface
    // Caching logic can be applied here as well if needed
    return this.userService.userDetailByUsername(userName);
  }
}

module.exports = UserServiceProxy;
