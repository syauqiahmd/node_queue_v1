const { PrismaClient } = require('../../infra/db/generated/prisma/client'); // Path changed to reflect new prisma location
const logger = require('../utils/log.helper'); // Path changed to reflect new logger location

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

module.exports = prisma;
