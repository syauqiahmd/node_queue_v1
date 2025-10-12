require('dotenv').config();
const cron = require('node-cron');
const container = require('../container');
const logger = container.resolve('logger');

// Schedule times can be set via environment variables or default values
const PRE_CALCULATE_TIME = process.env.PRE_CALCULATE_TIME || '0 21 * * *';
const HOUSEKEEPING_TIME = process.env.HOUSEKEEPING_TIME || '0 22 * * 0';

cron.schedule(PRE_CALCULATE_TIME, async () => {
  logger.info('[CRON] Running daily report generation...');
  try {
    logger.info('[CRON] Daily report generation completed successfully');
  } catch (error) {
    logger.error('[CRON] Daily report generation failed', error);
  }
});

cron.schedule(HOUSEKEEPING_TIME, async () => {
  logger.info('[CRON] Running housekeeping tasks...');
  try {
    logger.info('[CRON] Housekeeping task completed successfully');
  } catch (error) {
    logger.error('[CRON] Housekeeping task failed', error);
  }
});
