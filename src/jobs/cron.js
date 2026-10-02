// Identifies this process in logs; the API, cron and websocket services share log files.
process.env.SERVICE_NAME ??= 'node-queue-cron';
require('dotenv').config();
const cron = require('node-cron');
const container = require('../container');
const { nowInAppTz } = require('../core/utils/date');
const { registerProcessHandlers } = require('../infra/lifecycle/processHandlers');
const logger = container.resolve('logger');

registerProcessHandlers({
  logger,
  name: 'cron',
  onShutdown: async () => {
    cron.getTasks().forEach((task) => task.stop());
    await container.resolve('prismaClient').$disconnect();
    container.resolve('messageBroker').close();
  },
});

// Logs a structured "finished" line per run (job name + duration) so it's easy to check
// in log queries when each job last ran and how long it took.
const timed = (job, fn) => async () => {
  const start = Date.now();
  try {
    await fn();
  } finally {
    logger.info(`[CRON] ${job} finished`, {
      context: 'Cron',
      job,
      durationMs: Date.now() - start,
    });
  }
};

const queueService = container.resolve('queueService');

// Schedule times can be set via environment variables or default values
const PRE_CALCULATE_TIME = process.env.PRE_CALCULATE_TIME || '0 21 * * *';
const HOUSEKEEPING_TIME_QUEUE_DATA = process.env.HOUSEKEEPING_TIME_QUEUE_DATA || '0 1 1 * *';
const HOUSEKEEPING_TIME_S3_FILES = process.env.HOUSEKEEPING_TIME_S3_FILES || '0 22 * * *';

cron.schedule(
  PRE_CALCULATE_TIME,
  timed('dailyStats', async () => {
    logger.info('[CRON] Running daily report generation...');
    try {
      const date = nowInAppTz();
      const formatedDate = date.toISOString().split('T')[0];
      const result = await queueService.generateDailyStats(formatedDate);
      if (result) {
        logger.info(
          `[CRON] Daily report generation completed successfully. Created ${result.count} daily stats.`
        );
      } else {
        logger.info('[CRON] Daily report generation completed successfully. No data to create.');
      }
    } catch (error) {
      logger.error('[CRON] Daily report generation failed', error);
    }
  })
);

cron.schedule(
  HOUSEKEEPING_TIME_QUEUE_DATA,
  timed('housekeepingQueueData', async () => {
    logger.info('[CRON] Running housekeeping queue data tasks...');
    try {
      const now = nowInAppTz();
      const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const result = await queueService.cleanUpTicket(startOfCurrentMonth);
      logger.info(
        `[CRON] Housekeeping queue data task completed successfully. Deleted ${result.count} tickets.`
      );
    } catch (error) {
      logger.error('[CRON] Housekeeping queue data task failed', error);
    }
  })
);

cron.schedule(
  HOUSEKEEPING_TIME_S3_FILES,
  timed('housekeepingS3Files', async () => {
    logger.info('[CRON] Running housekeeping S3 files tasks...');
    let dirName = '';
    try {
      const now = nowInAppTz();
      const yesterday = new Date(now);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      dirName = `sound-generated/${yesterday.toISOString().split('T')[0]}`;

      const result = await queueService.cleanUpS3Files(dirName);

      logger.info(
        `[CRON] Housekeeping S3 files ${dirName} task completed successfully. Deleted ${result.count} files.`
      );
    } catch (error) {
      logger.error(`[CRON] Housekeeping S3 files ${dirName} task failed`, error);
    }
  })
);
