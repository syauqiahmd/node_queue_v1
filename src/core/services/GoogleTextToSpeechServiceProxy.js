const crypto = require('crypto');

class GoogleTextToSpeechServiceProxy {
  constructor({ googleTextToSpeechServiceReal, redisClient, logger }) {
    this.googleTextToSpeechService = googleTextToSpeechServiceReal;
    this.redisClient = redisClient;
    this.logger = logger;
    this.cacheKeyPrefix = 'tts:';
    this.cacheDuration = 3600; // Cache for 1 hour
  }

  generateCacheKey(text) {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    return `${this.cacheKeyPrefix}${hash.digest('hex')}`;
  }

  async generateSound(text) {
    const cacheKey = this.generateCacheKey(text);
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for TTS: ${cacheKey}`);
      return cachedData;
    }

    this.logger.info('Cache miss for TTS. Fetching from real service.');
    const data = await this.googleTextToSpeechService.generateSound(text);
    await this.redisClient.set(cacheKey, data, 'EX', this.cacheDuration);
    return data;
  }

  async invalidateCache(text) {
    const cacheKey = this.generateCacheKey(text);
    this.logger.info(`Invalidating TTS cache for key: ${cacheKey}`);
    await this.redisClient.del(cacheKey);
  }
}

module.exports = GoogleTextToSpeechServiceProxy;
