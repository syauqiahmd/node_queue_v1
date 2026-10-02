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

const SLOW_QUERY_MS = Number(process.env.PRISMA_SLOW_QUERY_MS) || 500;

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`[Prisma Query] ${e.query}`, {
      duration: `${e.duration}ms`,
      params: e.params,
      target: e.target,
    });
  }
  // Surface slow queries in every environment. Params are omitted since they may hold
  // personal data (phone numbers, emails).
  if (e.duration >= SLOW_QUERY_MS) {
    logger.warn(`[Prisma Slow Query] ${e.duration}ms`, {
      context: 'Prisma',
      durationMs: e.duration,
      query: e.query,
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
