class DbConnectionChecker {
  constructor({ prismaClient, logger }) {
    this.prisma = prismaClient;
    this.logger = logger;
  }

  async checkDbConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info('Database connected successfully', {
        service: 'PostgreSQL',
        context: 'StartupCheck',
      });
    } catch (error) {
      this.logger.error('Database connection failed', {
        service: 'PostgreSQL',
        context: 'StartupCheck',
        error,
      });
      process.exit(1); // Stop app if DB is unreachable
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

module.exports = DbConnectionChecker;
