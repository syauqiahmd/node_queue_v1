const express = require('express');
const cronSchema = require('../validation/cron.schema');

module.exports = ({
  cronController,
  authMiddleware,
  validateMiddleware,
}) => {
  const router = express.Router();

  router.post(
    '/trigger',
    authMiddleware.authenticateToken,
    authMiddleware.authorize(['ADMIN']),
    validateMiddleware.validate(cronSchema.triggerCron),
    cronController.triggerCron.bind(cronController)
  );

  return router;
};
