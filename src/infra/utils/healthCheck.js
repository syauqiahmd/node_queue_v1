class HealthCheck {
  constructor({ prismaClient, redisClient, s3Client, logger }) {
    this.prisma = prismaClient;
    this.redisClient = redisClient;
    this.s3Client = s3Client;
    this.logger = logger;
  }

  async checkDbConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info('Database connected successfully', {
        service: 'PostgreSQL',
        context: 'StartupCheck',
      });
      return true;
    } catch (error) {
      this.logger.error('Database connection failed', {
        service: 'PostgreSQL',
        context: 'StartupCheck',
        error,
      });
      return false;
    } finally {
      // Disconnect only if the connection was established and not part of a pool
      // For Prisma, $disconnect is usually called when the app shuts down.
      // For a simple check, it's fine, but be mindful of connection pooling.
      // await this.prisma.$disconnect(); // Removed to avoid disconnecting the main client
    }
  }

  async checkRedisConnection() {
    try {
      // The connect method in RedisClient already handles connection and throws on failure.
      // We just need to check its status after connect has been called in server.js
      if (this.redisClient.status()) {
        this.logger.info('Redis connected successfully', {
          service: 'Redis',
          context: 'StartupCheck',
        });
        return true;
      }
      this.logger.error('Redis connection failed: Client not connected after startup.', {
        service: 'Redis',
        context: 'StartupCheck',
      });
      return false;
    } catch (error) {
      this.logger.error('Redis connection failed', {
        service: 'Redis',
        context: 'StartupCheck',
        error,
      });
      return false;
    }
  }

  async checkS3Connection() {
    try {
      // Attempt to list buckets or head a known bucket to check S3 connectivity
      // A simple listBuckets is usually sufficient for a basic check
      await this.s3Client.s3.listBuckets().promise();
      this.logger.info('S3 connected successfully', {
        service: 'S3',
        context: 'StartupCheck',
      });
      return true;
    } catch (error) {
      this.logger.error('S3 connection failed', {
        service: 'S3',
        context: 'StartupCheck',
        error,
      });
      return false;
    }
  }

  async runChecks() {
    this.logger.info('Running infrastructure health checks...', { context: 'StartupCheck' });
    const dbOk = await this.checkDbConnection();
    const redisOk = await this.checkRedisConnection();
    const s3Ok = await this.checkS3Connection();

    if (dbOk && redisOk && s3Ok) {
      this.logger.info('All critical infrastructure services are connected.', {
        context: 'StartupCheck',
      });
      return true;
    } else {
      this.logger.error(
        'One or more critical infrastructure services failed to connect. Exiting application.',
        { context: 'StartupCheck' }
      );
      process.exit(1);
    }
  }
}

module.exports = HealthCheck;
