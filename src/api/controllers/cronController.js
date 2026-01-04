const CRON_TYPES = require('../../core/constants/cronTypes');

class CronController {
  constructor({ queueService, responseFormatter, logger, businessException }) {
    this.queueService = queueService;
    this.responseFormatter = responseFormatter;
    this.logger = logger;
    this.businessException = businessException;
  }

  async triggerCron(req, res, next) {
    try {
      const { date, cronType, masterPassword } = req.body;

      if (masterPassword !== process.env.MASTER_PASSWORD) {
        throw this.businessException.Forbidden('Invalid master password');
      }

      const formattedDate = new Date(date).toISOString().split('T')[0];

      this.logger.info(`[CronController] Triggering manual cron: ${cronType} for date: ${formattedDate}`);

      switch (cronType) {
        case CRON_TYPES.PRE_CALCULATE:
          await this.queueService.generateDailyStats(formattedDate);
          break;

        case CRON_TYPES.HOUSEKEEPING_QUEUE_DATA:
          // For queue data, we pass the date object directly
          await this.queueService.cleanUpTicket(new Date(date));
          break;

        case CRON_TYPES.HOUSEKEEPING_S3_FILES:
          const dirName = `sound-generated/${formattedDate}`;
          await this.queueService.cleanUpS3Files(dirName);
          break;

        default:
          throw new Error('Invalid cron type');
      }

      return res.status(200).json({ success: true, message: `Cron ${cronType} triggered successfully` });
    } catch (error) {
      this.logger.error('[CronController] Failed to trigger cron', error);
      next(error);
    }
  }
}

module.exports = CronController;
