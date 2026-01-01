require('dotenv').config();
const cron = require('node-cron');
const container = require('../container');
const logger = container.resolve('logger');

const queueService = container.resolve('queueService');

// Schedule times can be set via environment variables or default values
const PRE_CALCULATE_TIME = process.env.PRE_CALCULATE_TIME || '0 21 * * *';
const HOUSEKEEPING_TIME_QUEUE_DATA = process.env.HOUSEKEEPING_TIME_QUEUE_DATA || '0 1 1 * *';
const HOUSEKEEPING_TIME_S3_FILES = process.env.HOUSEKEEPING_TIME_S3_FILES || '0 22 * * *';

cron.schedule(PRE_CALCULATE_TIME, async () => {
  logger.info('[CRON] Running daily report generation...');
  try {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    const formatedDate = date.toISOString().split('T')[0];
    const result = await queueService.generateDailyStats(formatedDate);
    if (result) {
      logger.info(`[CRON] Daily report generation completed successfully. Created ${result.count} daily stats.`);
    } else {
      logger.info('[CRON] Daily report generation completed successfully. No data to create.');
    }
  } catch (error) {
    logger.error('[CRON] Daily report generation failed', error);
  }
});

cron.schedule(HOUSEKEEPING_TIME_QUEUE_DATA, async () => {
  logger.info('[CRON] Running housekeeping queue data tasks...');
  try {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await queueService.cleanUpTicket(startOfCurrentMonth);
    logger.info(`[CRON] Housekeeping queue data task completed successfully. Deleted ${result.count} tickets.`);
  } catch (error) {
    logger.error('[CRON] Housekeeping queue data task failed', error);
  }
});

cron.schedule(HOUSEKEEPING_TIME_S3_FILES, async () => {
  logger.info('[CRON] Running housekeeping S3 files tasks...');
  try {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000); // GMT+8
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const dirName = `sound-generated/${yesterday.toISOString().split('T')[0]}`;
    console.log("🚀 ~ dirName:", dirName)
    const result = await queueService.cleanUpS3Files(dirName);
    logger.info(`[CRON] Housekeeping S3 files ${dirName} task completed successfully. Deleted ${result.count} files.`);

  } catch (error) {
    logger.error(`[CRON] Housekeeping S3 files ${dirName} task failed`, error);
  }
});
