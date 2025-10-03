class UserServiceProxy {
  constructor({ userServiceReal, redisClient, logger }) {
    this.userService = userServiceReal; // Assign the real service
    this.redisClient = redisClient;
    this.logger = logger;
    this.cacheKeyPrefix = 'user:';
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
    const data = await this.userService.getAll(payload);
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
    const data = await this.userService.getById(id);
    if (data) {
      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    }
    return data;
  }

  async create(data) {
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.userService.create(data);
  }

  async update(id, data) {
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.userService.update(id, data);
  }

  async remove(id) {
    await this.redisClient.del(`${this.cacheKeyPrefix}id:${id}`);
    await this.redisClient.del(`${this.cacheKeyPrefix}all:*`);
    return this.userService.remove(id);
  }

  async userDetailByUsername(userName) {
    // This method is specific to UserService and might not be part of a generic interface
    // Caching logic can be applied here as well if needed
    return this.userService.userDetailByUsername(userName);
  }
}

module.exports = UserServiceProxy;
