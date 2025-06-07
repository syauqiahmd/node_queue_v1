const { PrismaClient } = require('../generated/prisma');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`[Prisma Query] ${e.query}`, {
      duration: `${e.duration}ms`,
      params: e.params,
      target: e.target,
    });
  }
});

prisma.$on('info', (e) => {
  logger.info(`[Prisma Info] ${e.message}`, { target: e.target });
});

prisma.$on('warn', (e) => {
  logger.warn(`[Prisma Warn] ${e.message}`, { target: e.target });
});

prisma.$on('error', (e) => {
  logger.error(`[Prisma Error] ${e.message}`, { target: e.target });
});

const checkDbConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connected successfully', {
      service: 'PostgreSQL',
      context: 'StartupCheck',
    });
  } catch (error) {
    logger.error('Database connection failed', {
      service: 'PostgreSQL',
      context: 'StartupCheck',
      error,
    });
    process.exit(1); // Stop app if DB is unreachable
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = { prisma, checkDbConnection };
