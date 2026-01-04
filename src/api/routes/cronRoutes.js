const express = require('express');
const cronSchema = require('../validation/cron.schema');

module.exports = ({ cronController, authMiddleware, validateMiddleware }) => {
  const router = express.Router();

  /**
   * POST /cron/trigger
   * @summary Trigger cron job
   * @tags #Cron
   * @param {object} request.body.required - cron job trigger data
   * @param {string} request.body.date.required - ISO date string for job execution
   * @param {string} request.body.cronType.required - cron type (PRE_CALCULATE, HOUSEKEEPING_QUEUE_DATA, HOUSEKEEPING_S3_FILES)
   * @param {string} request.body.masterPassword.required - master password for authentication
   * @example request - example payload
   * {
   *   "date": "2026-01-02",
   *   "cronType": "PRE_CALCULATE",
   *   "masterPassword": "password123"
   * }

   * @returns {object} 200 - Success response
   * @returns {object} 401 - Unauthorized
   * @returns {object} 500 - Internal Server Error
   * @example response - 200 - Example success response
   * {
   *   "success": true,
   *   "data": {
   *     "message": "Cron job triggered successfully"
   *   }
   * }
   */

  router.post(
    '/trigger',
    authMiddleware.authenticateToken,
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(cronSchema.triggerCron),
    cronController.triggerCron.bind(cronController)
  );

  return router;
};
